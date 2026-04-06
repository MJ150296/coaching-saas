#!/usr/bin/env node
async function main() {
const { spawnSync } = await import("node:child_process");
const fs = await import("node:fs");
const os = await import("node:os");
const path = await import("node:path");

const root = process.cwd();
const adminRoot = path.join(root, "src", "app", "admin-roles");
const nextEnv = path.join(root, "next-env.d.ts");
const tsconfig = path.join(root, "tsconfig.json");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name === "page.tsx") {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(adminRoot)) {
  console.error("Admin pages directory not found:", adminRoot);
  process.exit(1);
}

const pages = walk(adminRoot).sort();
if (pages.length === 0) {
  console.log("No admin pages found.");
  process.exit(0);
}

let hasFailures = false;
const failures = [];

for (const pageAbs of pages) {
  const pageRel = path.relative(root, pageAbs).replaceAll(path.sep, "/");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsc-admin-page-"));
  const cfgPath = path.join(tmpDir, "tsconfig.json");
  const cfg = {
    extends: tsconfig,
    compilerOptions: {
      noEmit: true,
      incremental: false,
      pretty: false,
    },
    include: [
      nextEnv,
      pageAbs,
      path.join(root, "src", "types", "**", "*.d.ts"),
    ],
    exclude: [path.join(root, "node_modules"), path.join(root, ".next")],
  };

  fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
  console.log(`===== CHECK ${pageRel} =====`);

  const run = spawnSync("npx", ["tsc", "-p", cfgPath, "--pretty", "false"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (run.status === 0) {
    console.log(`PASS: ${pageRel}\n`);
  } else {
    hasFailures = true;
    failures.push(pageRel);
    console.log(`FAIL: ${pageRel}\n`);
  }
}

if (!hasFailures) {
  console.log(`All admin pages passed (${pages.length}/${pages.length}).`);
  process.exit(0);
}

console.error(
  `Admin page type-check failed (${failures.length}/${pages.length} pages):`
);
for (const page of failures) {
  console.error(`- ${page}`);
}
process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
