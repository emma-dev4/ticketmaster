import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, ".output/public");

const child = spawn("node", ["scripts/with-app-env.mjs", "vite", "build"], {
  cwd: root,
  env: { ...process.env, GITHUB_PAGES: "1" },
  stdio: "inherit",
});

const code = await new Promise((resolve) => child.on("close", resolve));
try {
  await access(join(publicDir, "assets"));
  await access(join(root, "node_modules/.nitro/vite/services/ssr/index.js"));
} catch {
  process.exit(code || 1);
}

const server = await import(join(root, "node_modules/.nitro/vite/services/ssr/index.js"));
const res = await server.default.fetch(new Request("https://emma-dev4.github.io/ticketmaster/"));
if (!res.ok) {
  console.error("pages render failed", res.status);
  process.exit(1);
}
const html = await res.text();
if (!html.includes("/ticketmaster/assets/")) {
  console.error("rendered html is missing the pages asset base");
  process.exit(1);
}
await mkdir(publicDir, { recursive: true });
await writeFile(join(publicDir, "index.html"), html);
await writeFile(join(publicDir, "404.html"), html);
await writeFile(join(publicDir, ".nojekyll"), "");
await rm(join(publicDir, "index"), { force: true });
console.log(`wrote GitHub Pages shell (${html.length} bytes)`);
if (code !== 0) console.log("vite exited", code, "after the client build; static shell was still written");
