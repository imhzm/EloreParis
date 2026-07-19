import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const component = readFileSync(path.join(root, "src/components/localized-journal-experience.tsx"), "utf8");
const styles = readFileSync(path.join(root, "src/components/localized-journal-experience.module.css"), "utf8");
const content = readFileSync(path.join(root, "src/lib/journal-content.ts"), "utf8");

assert.doesNotMatch(component, /useScrollSceneProgress|keepFocusVisible/);
assert.match(component, /const \[featured, \.\.\.remainingStories\] = records/);
assert.match(component, /data-journal-featured/);
assert.match(component, /className=\{styles\.storyGrid\}/);
assert.match(component, /data-article-toc/);
assert.match(component, /href=\{`#chapter-\$\{index \+ 1\}`\}/);
assert.match(component, /data-article-faq/);
assert.match(component, /className=\{styles\.disclaimer\}>\{copy\.disclaimer\}/);
assert.doesNotMatch(component, /author|byline|sourceUrl/iu);
assert.doesNotMatch(styles, /position:\s*sticky|135svh/);
assert.match(styles, /prefers-reduced-motion:\s*reduce/);
assert.match(content, /General information, not diagnosis or treatment\./);
assert.match(content, /معلومات عامة وليست تشخيصًا أو علاجًا\./);
assert.doesNotMatch(content, /author\s*:/iu);

console.log("Journal compact magazine, article TOC, FAQ, disclaimer and provenance source checks passed.");
