import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const contract = JSON.parse(await readFile("artifacts/release/deployment-contract.json", "utf8"));
if (contract.schemaVersion !== 1 || contract.platform !== "cloudflare-worker") throw new Error("发布合同不是 Cloudflare Worker v1。\n");
const workerName = String(contract.workerName || "").trim();
if (!workerName) throw new Error("发布合同缺少 Worker 名称。\n");
const child = spawn("npx", ["wrangler", "deploy", "--config", "dist/server/wrangler.json", "--name", workerName], { stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 1));
