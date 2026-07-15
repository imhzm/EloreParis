import fs from "fs";
import path from "path";

const root = process.argv[2] ?? "D:/REDA/skills";
const issues = [];

const isPlaceholderLink = (target) =>
  target.startsWith("path/to/") ||
  target.startsWith("src/components/") ||
  target.startsWith("figmaUrl?");

const normalizeTarget = (target) => target.split("#")[0].trim();

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === ".system" || entry.name === "scripts") {
    continue;
  }

  const skillDir = path.join(root, entry.name);
  const skillFile = path.join(skillDir, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    issues.push({ skill: entry.name, type: "missing-skill-md" });
    continue;
  }

  const text = fs.readFileSync(skillFile, "utf8");
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatter) {
    issues.push({ skill: entry.name, type: "unparseable-frontmatter" });
  } else {
    const meta = frontmatter[1];
    if (!/^name:\s*.+/m.test(meta)) {
      issues.push({ skill: entry.name, type: "frontmatter-missing-name" });
    }
    if (!/^description:\s*.+/m.test(meta)) {
      issues.push({ skill: entry.name, type: "frontmatter-missing-description" });
    }
  }

  const refs = text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const [, rawTarget] of refs) {
    if (/^(https?:|#)/i.test(rawTarget) || isPlaceholderLink(rawTarget)) {
      continue;
    }

    const target = normalizeTarget(rawTarget);
    if (!target) {
      continue;
    }

    const resolved = path.resolve(skillDir, target);
    if (!fs.existsSync(resolved)) {
      issues.push({ skill: entry.name, type: "broken-link", target: rawTarget });
    }
  }
}

const summary = issues.reduce((acc, issue) => {
  acc[issue.type] = (acc[issue.type] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ root, summary, issues }, null, 2));
process.exit(issues.length === 0 ? 0 : 1);
