import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { once } from "node:events";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const serverFile = path.resolve(root, ".next/standalone/server.js");
const databasePath = path.resolve(root, ".data/site-content-authority-check.sqlite");
const mediaRoot = path.resolve(root, ".data/site-content-authority-check-media");
const baseUrl = "http://127.0.0.1:3076";

if (!existsSync(serverFile)) throw new Error("Standalone build is missing. Run npm run build first.");
rmSync(databasePath, { force: true });
rmSync(mediaRoot, { recursive: true, force: true });

let output = "";
const server = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: root,
    HOSTNAME: "127.0.0.1",
    PORT: "3076",
    APP_ENV: "development",
    AUTHORITY_DB_PATH: databasePath,
    PROMOTION_MEDIA_ROOT: mediaRoot,
    OPS_ACCESS_USERS_JSON: JSON.stringify([
      { id: "content-manager", name: "Content manager", role: "manager", accessCode: "site-content-authority-test-access" },
      { id: "content-auditor", name: "Content auditor", role: "auditor", accessCode: "site-content-authority-auditor-access" },
    ]),
    OPS_ACCESS_SIGNING_SECRET: "site-content-authority-test-signing-secret",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Site content authority server did not start.\n${output}`);
}

let sessionCookie = "";
async function request(method, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      Cookie: sessionCookie,
      ...(body === undefined ? {} : body instanceof FormData ? { Origin: baseUrl } : { "Content-Type": "application/json", Origin: baseUrl }),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const payload = await response.json();
  return { response, payload };
}

try {
  await waitForServer();
  assert.equal((await fetch(`${baseUrl}/api/ops/content`)).status, 401);
  const login = await fetch(`${baseUrl}/api/ops-access/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ accessCode: "site-content-authority-test-access", nextPath: "/ops/content" }),
  });
  assert.equal(login.status, 200);
  sessionCookie = (login.headers.get("set-cookie") ?? "").split(";", 1)[0];

  const initial = await request("GET", "/api/ops/content");
  assert.equal(initial.response.status, 200);
  assert.equal(initial.payload.latestVersion, 0);
  assert.equal(initial.payload.publishedVersion, null);

  const versionOneTitle = "اختبار سلطة المحتوى — الإصدار الأول";
  const versionOneAboutTitle = "اختبار صفحة قصتنا — الإصدار الأول";
  const versionOneFooter = "اختبار تذييل محكوم — الإصدار الأول";
  const versionOneJournal = "اختبار مقال محكوم — الإصدار الأول";
  const versionOneDiscovery = "اختبار مسار اكتشاف — الإصدار الأول";
  const versionOneShop = "اختبار متجر محكوم — الإصدار الأول";
  const versionOneCategory = "اختبار فئة محكومة — الإصدار الأول";
  const versionOneBento = "اختبار Bento محكوم — الإصدار الأول";
  const firstContent = structuredClone(initial.payload.content);
  firstContent.home.ar.hero.title = versionOneTitle;
  firstContent.seo.ar.homeTitle = `${versionOneTitle} | ÉLORÉ PARIS`;
  firstContent.trustSupport.ar.about.title = versionOneAboutTitle;
  firstContent.shell.ar.footerTagline = versionOneFooter;
  const firstJournalSlug = Object.keys(firstContent.editorial.journalContent.ar)[0];
  firstContent.editorial.journalContent.ar[firstJournalSlug].title = versionOneJournal;
  firstContent.editorial.discoveryRecords.ar.concern[0].title = versionOneDiscovery;
  firstContent.editorial.shop.ar.hero.title = versionOneShop;
  firstContent.editorial.categoryCopy.ar.skincare.title = versionOneCategory;
  firstContent.editorial.bento.ar.cards[0].title = versionOneBento;

  const imagePath = path.resolve(root, "public/elore-assets/editorial-skin-light-concept-1122w.avif");
  const mediaForm = new FormData();
  mediaForm.set("file", new File([readFileSync(imagePath)], "journal-authority.avif", { type: "image/avif" }));
  mediaForm.set("altAr", "صورة تحريرية محكومة لاختبار المجلة");
  mediaForm.set("altEn", "Governed editorial journal regression image");
  mediaForm.set("rightsEvidenceRef", "test://rights/site-content-authority");
  const uploaded = await request("POST", "/api/ops/media", mediaForm);
  assert.equal(uploaded.response.status, 201, JSON.stringify(uploaded.payload));
  assert.equal(uploaded.payload.asset.status, "pending");
  const pendingMediaContent = structuredClone(firstContent);
  pendingMediaContent.editorial.journalHeroImage = uploaded.payload.asset.publicUrl;
  assert.equal((await request("PUT", "/api/ops/content", {
    content: pendingMediaContent,
    expectedVersion: 0,
    changeSummary: "Pending media must not publish",
  })).response.status, 400);
  const approved = await request("PATCH", "/api/ops/media", { action: "approve", assetId: uploaded.payload.asset.id });
  assert.equal(approved.response.status, 200);
  firstContent.editorial.journalHeroImage = uploaded.payload.asset.publicUrl;

  const invalidStructuralContent = structuredClone(firstContent);
  invalidStructuralContent.editorial.journalContent.ar[firstJournalSlug].slug = "unsafe-new-slug";
  assert.equal((await request("PUT", "/api/ops/content", {
    content: invalidStructuralContent,
    expectedVersion: 0,
    changeSummary: "Structural keys must be immutable",
  })).response.status, 400);
  const invalidMediaContent = structuredClone(firstContent);
  invalidMediaContent.editorial.shop.ar.hero.image = "https://evil.example/image.jpg";
  assert.equal((await request("PUT", "/api/ops/content", {
    content: invalidMediaContent,
    expectedVersion: 0,
    changeSummary: "External media must be rejected",
  })).response.status, 400);
  const first = await request("PUT", "/api/ops/content", {
    content: firstContent,
    expectedVersion: 0,
    changeSummary: "Regression revision one",
  });
  assert.equal(first.response.status, 201, JSON.stringify(first.payload));
  assert.equal(first.payload.workspace.latestVersion, 1);
  assert.equal(first.payload.workspace.publishedVersion, null);
  assert.equal((await (await fetch(`${baseUrl}/ar`)).text()).includes(versionOneTitle), false);
  assert.equal((await (await fetch(`${baseUrl}/ar/about`)).text()).includes(versionOneAboutTitle), false);
  assert.equal((await (await fetch(`${baseUrl}/ar/journal/${firstJournalSlug}`)).text()).includes(versionOneJournal), false);

  const publishedOne = await request("PATCH", "/api/ops/content", {
    action: "publish",
    revisionId: first.payload.revision.id,
    approvalRef: "test://approval/revision-one",
  });
  assert.equal(publishedOne.response.status, 200);
  assert.equal(publishedOne.payload.workspace.publishedVersion, 1);
  assert.equal((await (await fetch(`${baseUrl}/ar`)).text()).includes(versionOneTitle), true);
  assert.equal((await (await fetch(`${baseUrl}/ar`)).text()).includes(versionOneFooter), true);
  assert.equal((await (await fetch(`${baseUrl}/ar/about`)).text()).includes(versionOneAboutTitle), true);
  assert.equal((await (await fetch(`${baseUrl}/ar/journal/${firstJournalSlug}`)).text()).includes(versionOneJournal), true);
  assert.equal((await (await fetch(`${baseUrl}/ar/journal`)).text()).includes(uploaded.payload.asset.id), true);
  assert.equal((await fetch(`${baseUrl}${uploaded.payload.asset.publicUrl}`)).status, 200);
  assert.equal((await (await fetch(`${baseUrl}/ar/concerns`)).text()).includes(versionOneDiscovery), true);
  assert.equal((await (await fetch(`${baseUrl}/ar/shop`)).text()).includes(versionOneShop), true);
  assert.equal((await (await fetch(`${baseUrl}/ar/shop/skincare`)).text()).includes(versionOneCategory), true);
  assert.equal((await (await fetch(`${baseUrl}/ar`)).text()).includes(versionOneBento), true);

  const versionTwoTitle = "اختبار سلطة المحتوى — الإصدار الثاني";
  const secondContent = structuredClone(firstContent);
  secondContent.home.ar.hero.title = versionTwoTitle;
  secondContent.seo.ar.homeTitle = `${versionTwoTitle} | ÉLORÉ PARIS`;
  secondContent.editorial.journalContent.ar[firstJournalSlug].title = "اختبار مقال محكوم — الإصدار الثاني";
  const second = await request("PUT", "/api/ops/content", {
    content: secondContent,
    expectedVersion: 1,
    changeSummary: "Regression revision two",
  });
  assert.equal(second.response.status, 201);
  assert.equal((await request("PUT", "/api/ops/content", {
    content: secondContent,
    expectedVersion: 1,
    changeSummary: "Stale write must fail",
  })).response.status, 409);
  assert.equal((await request("PUT", "/api/ops/content", {
    content: secondContent,
    expectedVersion: 2,
    changeSummary: "Identical content must not create duplicate revision",
  })).response.status, 409);

  const publishedTwo = await request("PATCH", "/api/ops/content", {
    action: "publish",
    revisionId: second.payload.revision.id,
    approvalRef: "test://approval/revision-two",
  });
  assert.equal(publishedTwo.response.status, 200);
  assert.equal((await (await fetch(`${baseUrl}/ar`)).text()).includes(versionTwoTitle), true);

  const rolledBack = await request("PATCH", "/api/ops/content", {
    action: "rollback",
    revisionId: first.payload.revision.id,
    approvalRef: "test://approval/rollback-one",
  });
  assert.equal(rolledBack.response.status, 200);
  assert.equal(rolledBack.payload.workspace.publishedVersion, 1);
  const rolledBackHtml = await fetch(`${baseUrl}/ar`).then((response) => response.text());
  assert.equal(rolledBackHtml.includes(versionOneTitle), true);
  assert.equal(rolledBackHtml.includes(versionTwoTitle), false);
  assert.equal((await (await fetch(`${baseUrl}/ar/journal/${firstJournalSlug}`)).text()).includes(versionOneJournal), true);

  const auditorLogin = await fetch(`${baseUrl}/api/ops-access/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ accessCode: "site-content-authority-auditor-access", nextPath: "/ops/content" }),
  });
  assert.equal(auditorLogin.status, 200);
  sessionCookie = (auditorLogin.headers.get("set-cookie") ?? "").split(";", 1)[0];
  assert.equal((await request("GET", "/api/ops/content")).response.status, 200);
  assert.equal((await request("PUT", "/api/ops/content", {
    content: secondContent,
    expectedVersion: 2,
    changeSummary: "Auditors must not write",
  })).response.status, 403);
  assert.equal((await request("PATCH", "/api/ops/media", {
    action: "retire",
    assetId: uploaded.payload.asset.id,
  })).response.status, 403);

  console.log("Site content auth, manager/auditor RBAC, validation, draft isolation, publish, optimistic concurrency, all-family live binding, and rollback checks passed.");
} finally {
  if (server.exitCode === null) {
    server.kill();
    await once(server, "exit");
  }
  rmSync(databasePath, { force: true });
  rmSync(`${databasePath}-wal`, { force: true });
  rmSync(`${databasePath}-shm`, { force: true });
  rmSync(mediaRoot, { recursive: true, force: true });
}
