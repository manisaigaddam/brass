"use client";

import { useCallback, useEffect, useState } from "react";

const STORE = "https://chromewebstore.google.com/detail/noir-wallet/mfoghjbpfanobmnoemoepenjjcmfpmdn";

async function findWallet() {
  const { detectProvider, getNoirWallet } = await import("@noir-wallet/sdk");
  const start = Date.now();
  void detectProvider(4000).catch(() => null);
  let wallet = getNoirWallet();
  while (!wallet?.zcash && Date.now() - start < 4000) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    wallet = getNoirWallet();
  }
  return wallet;
}

function short(address: string) {
  if (address.length < 18) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function ConnectNoir({ onAddress }: { onAddress?: (address: string | null) => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const publish = useCallback(
    (next: string | null) => {
      setAddress(next);
      onAddress?.(next);
    },
    [onAddress],
  );

  const refresh = useCallback(async () => {
    const wallet = await findWallet();
    if (!wallet?.zcash) {
      setMissing(true);
      publish(null);
      return;
    }
    setMissing(false);
    const existing = await wallet.zcash.getAccounts().catch(() => null);
    publish(existing?.shielded || existing?.accounts?.[0]?.addresses.shielded || null);
    return wallet;
  }, [publish]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let remove = () => {};
    void (async () => {
      const wallet = await findWallet();
      if (!wallet?.zcash) return;
      const handler = () => {
        void refresh();
      };
      wallet.zcash.on("accountsChanged", handler);
      remove = () => wallet.zcash.removeListener("accountsChanged", handler);
    })();
    return () => remove();
  }, [refresh]);

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const wallet = await findWallet();
      if (!wallet?.zcash) {
        setMissing(true);
        throw new Error("Noir was not detected. Open the extension, then reload this page.");
      }
      const existing = await wallet.zcash.getAccounts();
      const connection = existing ?? (await wallet.zcash.connect());
      publish(connection.shielded || connection.accounts?.[0]?.addresses.shielded || null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Noir did not connect.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    const { getNoirWallet } = await import("@noir-wallet/sdk");
    const wallet = getNoirWallet();
    try {
      await wallet?.zcash.disconnect();
    } catch {
      /* The button still returns to Connect Noir. */
    }
    publish(null);
  }

  return (
    <div className="wallet">
      {address ? (
        <>
          <span className="wallet-address">{short(address)}</span>
          <button className="button quiet" type="button" onClick={disconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <button className="button" type="button" onClick={connect} disabled={busy}>
          {busy ? "Waiting for Noir" : "Connect Noir"}
        </button>
      )}
      {missing ? (
        <a href={STORE}>Get Noir</a>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
