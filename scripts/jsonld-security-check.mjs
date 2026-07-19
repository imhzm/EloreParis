import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourcePath = path.join(root, "src", "lib", "site-content.ts");
const source = readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: sourcePath,
}).outputText;
const loadedModule = { exports: {} };
const executeModule = new Function("exports", "module", "require", transpiled);
executeModule(loadedModule.exports, loadedModule, () => {
  throw new Error("site-content.ts must remain dependency-free for this contract test.");
});

const { serializeJsonLd } = loadedModule.exports;
assert.equal(typeof serializeJsonLd, "function", "serializeJsonLd must be exported");

const hostilePayload = {
  title: "</script><img src=x onerror=alert(1)>",
  separators: "line\u2028paragraph\u2029",
  ampersand: "ELORE & PARIS",
};
const serialized = serializeJsonLd(hostilePayload);

assert.ok(!/[<>&\u2028\u2029]/u.test(serialized), "JSON-LD must not contain raw HTML-breaking characters");
assert.deepEqual(JSON.parse(serialized), hostilePayload, "JSON-LD escaping must preserve JSON semantics");
assert.throws(() => serializeJsonLd(undefined), TypeError, "undefined JSON-LD must fail explicitly");

function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

const publicSources = [
  ...listSourceFiles(path.join(root, "src", "app")),
  ...listSourceFiles(path.join(root, "src", "components")),
];
const jsonLdSources = publicSources.filter((filePath) =>
  readFileSync(filePath, "utf8").includes('type="application/ld+json"'),
);

assert.ok(jsonLdSources.length > 0, "Expected public JSON-LD surfaces to exist");

for (const filePath of jsonLdSources) {
  const fileSource = readFileSync(filePath, "utf8");
  assert.ok(
    fileSource.includes("serializeJsonLd("),
    `${path.relative(root, filePath)} must serialize JSON-LD through serializeJsonLd`,
  );
  assert.ok(
    !/dangerouslySetInnerHTML[\s\S]{0,240}JSON\.stringify\(/.test(fileSource),
    `${path.relative(root, filePath)} contains direct JSON.stringify in a JSON-LD injection`,
  );
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      checkedSurfaces: jsonLdSources.length,
      hostilePayloadRoundTrip: true,
    },
    null,
    2,
  ),
);
