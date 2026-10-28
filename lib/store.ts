import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { PayLink, Payment } from "./types";

export type Profile = {
  id: string;
  name: string;
  watcherId: string;
  createdAt: string;
};

type StoreData = {
  profiles: Profile[];
  payments: Payment[];
  links: PayLink[];
};

const file = path.join(process.cwd(), "data", "store.json");
const empty = (): StoreData => ({ profiles: [], payments: [], links: [] });
let chain: Promise<unknown> = Promise.resolve();

function upstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function read(): Promise<StoreData> {
  const redis = upstash();
  if (redis) {
    const response = await fetch(`${redis.url}/get/brass`, {
      headers: { authorization: `Bearer ${redis.token}` },
      cache: "no-store",
    });
    const data = (await response.json()) as { result?: string | null };
    if (!data.result) return empty();
    const parsed = JSON.parse(data.result) as StoreData;
    return {
      profiles: parsed.profiles ?? [],
      payments: parsed.payments ?? [],
      links: parsed.links ?? [],
    };
  }
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as StoreData;
    return {
      profiles: parsed.profiles ?? [],
      payments: parsed.payments ?? [],
      links: parsed.links ?? [],
    };
  } catch {
    return empty();
  }
}

async function write(data: StoreData) {
  const redis = upstash();
  if (redis) {
    await fetch(redis.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${redis.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(["SET", "brass", JSON.stringify(data)]),
    });
    return;
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

export function withStore<T>(fn: (data: StoreData) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const data = await read();
    const result = await fn(data);
    await write(data);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
