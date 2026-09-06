import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const contract = JSON.parse(await readFile("artifacts/release/deployment-contract.json", "utf8"));
if (contract.schemaVersion !== 1 || contract.platform !== "cloudflare-worker") throw new Error("发布合同不是 Cloudflare Worker v1。\n");
const workerName = String(contract.workerName || "").trim();
if (!workerName) throw new Error("发布合同缺少 Worker 名称。\n");
const domains = Array.isArray(contract.domains) ? contract.domains.map((domain) => String(domain || "").trim()).filter(Boolean) : [];
if (!domains.length) throw new Error("发布合同缺少正式域名。\n");
const args = ["wrangler", "deploy", "--config", "dist/server/wrangler.json", "--name", workerName];
for (const domain of domains) args.push("--domains", domain);
const child = spawn("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 1));
