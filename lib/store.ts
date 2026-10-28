import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { StoreData } from "./types";

const file = path.join(process.cwd(), "data", "store.json");

const empty = (): StoreData => ({ payments: [], links: [] });

let chain: Promise<unknown> = Promise.resolve();

async function read(): Promise<StoreData> {
  try {
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw) as StoreData;
    return {
      payments: data.payments ?? [],
      links: data.links ?? [],
    };
  } catch {
    return empty();
  }
}

async function write(data: StoreData): Promise<void> {
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
