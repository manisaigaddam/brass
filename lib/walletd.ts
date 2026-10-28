type CreatedAddress = {
  address: string;
  addressIndex: number;
};

export type Transfer = {
  address?: string;
  amount?: number;
  note?: string;
  txid?: string;
  confirmations?: number;
};

function baseUrl(): string | null {
  const url = process.env.WALLETD_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const root = baseUrl();
  if (!root) throw new Error("WALLETD_URL is not set.");
  const response = await fetch(`${root}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

export function watcherConfigured(): boolean {
  return Boolean(baseUrl());
}

export async function createDiversifiedAddress(label: string): Promise<CreatedAddress | null> {
  if (!baseUrl()) return null;
  const account = Number(process.env.WALLETD_ACCOUNT_INDEX ?? "0");
  const data = await post<{ address: string; address_index: number }>("/create_address", {
    account_index: account,
    label,
  });
  if (!data.address?.startsWith("u1")) {
    throw new Error("The watcher returned an address that is not a mainnet unified address.");
  }
  return { address: data.address, addressIndex: data.address_index };
}

export async function incomingForIndex(addressIndex: number): Promise<Transfer[]> {
  const account = Number(process.env.WALLETD_ACCOUNT_INDEX ?? "0");
  const data = await post<{ in?: Transfer[] }>("/get_transfers", {
    account_index: account,
    in: true,
    subaddr_indices: [addressIndex],
  });
  return data.in ?? [];
}

export async function transfersForTx(txid: string): Promise<Transfer[]> {
  const account = Number(process.env.WALLETD_ACCOUNT_INDEX ?? "0");
  const data = await post<{ transfer?: Transfer; transfers?: Transfer[] }>("/get_transfer_by_txid", {
    txid,
    account_index: account,
  });
  if (data.transfers?.length) return data.transfers;
  return data.transfer ? [data.transfer] : [];
}
