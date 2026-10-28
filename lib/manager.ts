const base = () => process.env.MANAGER_URL?.trim().replace(/\/$/, "") ?? "";

export async function manager<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const root = base();
  const secret = process.env.MANAGER_SECRET?.trim() ?? "";
  if (!root || !secret) {
    throw new Error("Set MANAGER_URL and MANAGER_SECRET. The watcher manager runs on the AWS machine.");
  }
  const response = await fetch(`${root}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "The watcher manager refused the request.");
  return data;
}
