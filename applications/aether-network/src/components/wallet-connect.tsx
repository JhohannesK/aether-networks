"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/utils";

type Provider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  connect: () => Promise<{ publicKey: { toBase58?: () => string; toString: () => string } }>;
};

function pickProvider(): Provider | null {
  const injected = window as unknown as {
    solana?: Provider;
    solflare?: Provider;
    phantom?: { solana?: Provider };
  };
  return injected.phantom?.solana ?? injected.solflare ?? injected.solana ?? null;
}

export function WalletConnect({
  demoPubkey,
  onChange,
}: {
  demoPubkey?: string;
  onChange?: (pubkey: string) => void;
}) {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setError(null);
    const provider = pickProvider();
    if (!provider) {
      const fallback = demoPubkey ?? "Demo wallet";
      setPubkey(fallback);
      onChange?.(fallback);
      setError("No Phantom / Solflare. Using the local treasury pubkey.");
      return;
    }
    const res = await provider.connect();
    const next = res.publicKey.toBase58?.() ?? res.publicKey.toString();
    setPubkey(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="pill" onClick={() => void connect()}>
        {pubkey ? shortAddr(pubkey, 4) : "Connect wallet"}
      </Button>
      {error ? <p className="text-xs text-muted">{error}</p> : null}
    </div>
  );
}
