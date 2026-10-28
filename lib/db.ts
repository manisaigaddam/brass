type Row = Record<string, unknown>;

function config() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the website.");
  }
  return { url, key };
}

async function rest<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init?.method === "POST" ? { prefer: "return=representation" } : {}),
      ...(init?.method === "PATCH" ? { prefer: "return=minimal" } : {}),
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (response.status === 204) return [] as T;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data ? String(data.message) : text;
    throw new Error(message || "Supabase request failed.");
  }
  return data as T;
}

export function dbGet<T extends Row[]>(tableAndQuery: string) {
  return rest<T>(tableAndQuery);
}

export function dbInsert<T extends Row>(table: string, row: Row) {
  return rest<T[]>(table, { method: "POST", body: row });
}

export function dbUpdate(table: string, query: string, row: Row) {
  return rest<unknown>(`${table}?${query}`, { method: "PATCH", body: row });
}
