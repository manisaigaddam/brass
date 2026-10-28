import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

try {
  const candidates = [new URL("./.env", import.meta.url), new URL("../../.env.local", import.meta.url)];
  for (const candidate of candidates) {
    try {
      const envFile = await readFile(candidate, "utf8");
      for (const line of envFile.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
      break;
    } catch {
      // Try the next location.
    }
  }
} catch {
  // The process environment is enough on AWS.
}

const SECRET = process.env.MANAGER_SECRET?.trim() ?? "";
const PORT = Number(process.env.MANAGER_PORT || 8090);
const DATA = path.resolve(process.env.MANAGER_DATA || path.join(process.cwd(), "data", "aws-watcher"));
const IMAGE = process.env.WALLETD_IMAGE || "hhanh00/zcash-walletd:latest";
const LWD = process.env.LWD_URL || "https://us.zec.stardust.rest:443";
const WEBSITE = (process.env.WEBSITE_URL || "").trim().replace(/\/$/, "");
const HOST_PORT_BASE = 18100;

if (!SECRET) {
  console.error("Set MANAGER_SECRET before starting the watcher.");
  process.exit(1);
}

const file = path.join(DATA, "accounts.json");
let accounts = [];
let chain = Promise.resolve();

function nid() {
  return `watch_${randomBytes(6).toString("hex")}`;
}

async function load() {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    accounts = parsed.accounts ?? [];
  } catch {
    accounts = [];
  }
}

async function save() {
  await mkdir(DATA, { recursive: true });
  await writeFile(file, JSON.stringify({ accounts }, null, 2));
}

function withAccounts(fn) {
  const run = chain.then(async () => {
    await load();
    const result = await fn();
    await save();
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function latestHeight() {
  const blockchair = await fetch("https://api.blockchair.com/zcash/stats", {
    headers: { accept: "application/json" },
  });
  if (blockchair.ok) {
    const data = await blockchair.json();
    const height = Number(data?.data?.best_block_height);
    if (Number.isInteger(height) && height > 1_000_000) return height;
  }
  const zebra = await fetch("https://zcash-mainnet-zebrad.gateway.tatum.io", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "1.0", id: "brass", method: "getblockcount", params: [] }),
  });
  const data = await zebra.json();
  const height = Number(data?.result);
  if (!Number.isInteger(height) || height < 1) {
    throw new Error("The watcher could not read the latest Zcash block.");
  }
  return height;
}

async function wallet(port, route, body) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Wallet watcher returned ${response.status}`);
  return text ? JSON.parse(text) : {};
}

async function waitForWallet(port) {
  const deadline = Date.now() + 60_000;
  let last = "starting";
  while (Date.now() < deadline) {
    try {
      await wallet(port, "/get_height", {});
      return;
    } catch (error) {
      last = error instanceof Error ? error.message : "starting";
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`The wallet watcher did not answer. ${last}`);
}

async function containerRunning(name) {
  try {
    const { stdout } = await exec("docker", ["inspect", "-f", "{{.State.Running}}", name]);
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

async function containerExists(name) {
  try {
    await exec("docker", ["inspect", name]);
    return true;
  } catch {
    return false;
  }
}

async function ensureContainer(account) {
  if (await containerRunning(account.container)) return;
  if (await containerExists(account.container)) {
    await exec("docker", ["start", account.container]);
    return;
  }
  const dir = path.join(DATA, "wallets", account.id);
  await mkdir(dir, { recursive: true });
  const notify = WEBSITE ? `${WEBSITE}/api/watch/` : "http://127.0.0.1:9/unset/";
  await writeFile(
    path.join(dir, "config.json"),
    JSON.stringify(
      {
        port: 8000,
        db_path: "/data/zec-wallet.db",
        confirmations: 1,
        lwd_url: LWD,
        notify_tx_url: notify,
        poll_interval: 15,
        regtest: false,
        orchard: true,
        vk: account.ufvk,
        birth_height: account.birthHeight,
      },
      null,
      2,
    ),
  );
  await exec("docker", [
    "run",
    "-d",
    "--name",
    account.container,
    "--restart",
    "unless-stopped",
    "-p",
    `127.0.0.1:${account.port}:8000`,
    "-v",
    `${dir}:/data`,
    "-e",
    "CONFIG_PATH=/data/config.json",
    "-e",
    "ROCKET_PORT=8000",
    "-e",
    "ROCKET_ADDRESS=0.0.0.0",
    "-e",
    "ROCKET_PROFILE=release",
    "--add-host",
    "host.docker.internal:host-gateway",
    IMAGE,
  ]);
}

function requireAccount(id) {
  const account = accounts.find((item) => item.id === id);
  if (!account) throw new Error("Watcher account not found.");
  return account;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${PORT}`);
  try {
    if (request.headers.authorization !== `Bearer ${SECRET}`) {
      send(response, 401, { error: "Watcher secret required." });
      return;
    }
    if (request.method === "GET" && url.pathname === "/v1/health") {
      send(response, 200, { ok: true, lwd: LWD });
      return;
    }
    if (request.method === "POST" && url.pathname === "/v1/accounts") {
      const account = await withAccounts(async () => {
        const body = await readBody(request);
        const ufvk = String(body.ufvk ?? "").trim();
        if (/\s/.test(ufvk) || !ufvk.startsWith("uview") || ufvk.length < 40) {
          throw new Error("Paste the Unified Full Viewing Key. It starts with uview. Do not paste the seed phrase.");
        }
        const used = new Set(accounts.map((item) => item.port));
        let port = HOST_PORT_BASE;
        while (used.has(port)) port += 1;
        const birthHeight = await latestHeight();
        const id = nid();
        const created = {
          id,
          name: id,
          ufvk,
          birthHeight,
          port,
          container: "",
          createdAt: new Date().toISOString(),
        };
        created.container = `brass-${created.id}`;
        await ensureContainer(created);
        await waitForWallet(created.port);
        accounts.unshift(created);
        return { id: created.id, birthHeight: created.birthHeight };
      });
      send(response, 200, { account });
      return;
    }
    const addressPost = url.pathname.match(/^\/v1\/accounts\/([^/]+)\/addresses$/);
    if (request.method === "POST" && addressPost) {
      const created = await withAccounts(async () => {
        const account = requireAccount(addressPost[1]);
        const body = await readBody(request);
        await ensureContainer(account);
        await waitForWallet(account.port);
        const result = await wallet(account.port, "/create_address", {
          account_index: 0,
          label: String(body.label ?? "payment"),
        });
        if (!String(result.address || "").startsWith("u1")) {
          throw new Error("The watcher did not return a mainnet unified address.");
        }
        return { address: result.address, addressIndex: result.address_index };
      });
      send(response, 200, created);
      return;
    }
    const transferPost = url.pathname.match(/^\/v1\/accounts\/([^/]+)\/transfers$/);
    if (request.method === "POST" && transferPost) {
      const transfers = await withAccounts(async () => {
        const account = requireAccount(transferPost[1]);
        const body = await readBody(request);
        await ensureContainer(account);
        const found = [];
        if (body.addressIndex != null) {
          const data = await wallet(account.port, "/get_transfers", {
            account_index: 0,
            in: true,
            subaddr_indices: [Number(body.addressIndex)],
          });
          found.push(...(data.in ?? []));
        }
        if (body.txid) {
          const extra = await wallet(account.port, "/get_transfer_by_txid", {
            txid: body.txid,
            account_index: 0,
          });
          found.push(...(extra.transfers?.length ? extra.transfers : extra.transfer ? [extra.transfer] : []));
        }
        return found.map((transfer) => ({
          address: transfer.address ?? "",
          amount: transfer.amount ?? 0,
          note: transfer.note ?? "",
          txid: transfer.txid ?? "",
        }));
      });
      send(response, 200, { transfers });
      return;
    }
    if (request.method === "POST" && url.pathname === "/v1/find") {
      const hits = await withAccounts(async () => {
        const body = await readBody(request);
        const txid = String(body.txid ?? "");
        const found = [];
        for (const account of accounts) {
          try {
            await ensureContainer(account);
            const data = await wallet(account.port, "/get_transfer_by_txid", {
              txid,
              account_index: 0,
            });
            const transfers = data.transfers?.length ? data.transfers : data.transfer ? [data.transfer] : [];
            for (const transfer of transfers) {
              found.push({
                accountId: account.id,
                address: transfer.address ?? "",
                amount: transfer.amount ?? 0,
                note: transfer.note ?? "",
                txid: transfer.txid || txid,
              });
            }
          } catch {
            // This account may still be scanning.
          }
        }
        return found;
      });
      send(response, 200, { hits });
      return;
    }
    send(response, 404, { error: "Not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watcher error.";
    send(response, 400, { error: message });
  }
});

await load();
for (const account of accounts) {
  try {
    await ensureContainer(account);
  } catch (error) {
    console.error(`Could not start ${account.id}:`, error instanceof Error ? error.message : error);
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Brass watcher listening on ${PORT}. Chain data from ${LWD}.`);
});
