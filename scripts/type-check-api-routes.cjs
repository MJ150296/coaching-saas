#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.cwd();
const apiRoot = path.join(root, "src", "app", "api");
const nextEnv = path.join(root, "next-env.d.ts");
const tscBin = path.join(root, "node_modules", ".bin", "tsc");

const heapMb = Number(process.env.API_TSC_HEAP_MB || "1536");
const timeoutSec = Number(process.env.API_TSC_TIMEOUT_SEC || "25");
const timeoutMs = timeoutSec * 1000;
const routeFilter = (process.env.API_ROUTE_FILTER || "").trim().toLowerCase();

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name === "route.ts") {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(apiRoot)) {
  console.error("API routes directory not found:", apiRoot);
  process.exit(1);
}

if (!fs.existsSync(tscBin)) {
  console.error("TypeScript binary not found at:", tscBin);
  process.exit(1);
}

const routes = walk(apiRoot)
  .sort()
  .filter((routeAbs) => {
    if (!routeFilter) return true;
    const rel = path.relative(root, routeAbs).replaceAll(path.sep, "/").toLowerCase();
    return rel.includes(routeFilter);
  });
if (routes.length === 0) {
  console.log(routeFilter ? `No API route files found for filter: ${routeFilter}` : "No API route files found.");
  process.exit(0);
}

let failures = 0;
let timeouts = 0;
let ooms = 0;

for (const routeAbs of routes) {
  const routeRel = path.relative(root, routeAbs).replaceAll(path.sep, "/");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsc-api-route-"));
  const cfgPath = path.join(tmpDir, "tsconfig.json");
  const cfg = {
    extends: path.join(root, "tsconfig.json"),
    compilerOptions: {
      noEmit: true,
      incremental: false,
      pretty: false,
      plugins: [],
    },
    include: [nextEnv, path.join(root, "src", "types", "**", "*.d.ts"), routeAbs],
    exclude: [path.join(root, "node_modules"), path.join(root, ".next")],
  };

  fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
  console.log(`===== CHECK ${routeRel} =====`);

  const run = spawnSync(
    tscBin,
    ["-p", cfgPath, "--pretty", "false"],
    {
      cwd: root,
      timeout: timeoutMs,
      env: {
        ...process.env,
        NODE_OPTIONS: `--max-old-space-size=${heapMb}`,
      },
      encoding: "utf8",
    }
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });

  const combinedOutput = `${run.stdout || ""}${run.stderr || ""}`.trim();
  const outLower = combinedOutput.toLowerCase();
  const hitOom =
    outLower.includes("heap out of memory") ||
    outLower.includes("allocation failed") ||
    run.status === 134;

  if (run.status === 0) {
    console.log(`PASS: ${routeRel}\n`);
    continue;
  }

  failures += 1;
  if (run.signal === "SIGTERM") {
    timeouts += 1;
    console.log(`TIMEOUT (${timeoutSec}s): ${routeRel}\n`);
    continue;
  }

  if (hitOom) {
    ooms += 1;
    console.log(`OOM: ${routeRel}`);
  } else {
    console.log(`FAIL: ${routeRel}`);
  }

  if (combinedOutput) {
    console.log(combinedOutput.split("\n").slice(0, 20).join("\n"));
  }
  console.log("");
}

if (failures === 0) {
  console.log(`All API routes passed (${routes.length}/${routes.length}).`);
  process.exit(0);
}

console.error(
  `API route checks finished with issues: failed=${failures}, timeouts=${timeouts}, ooms=${ooms}, total=${routes.length}`
);
process.exit(1);
