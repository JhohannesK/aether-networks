"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { WalletConnect } from "@/components/wallet-connect";
import { isHttpUrl } from "@/lib/utils";

export function CreateTaskDialog({
  defaultTitle,
  defaultUrl,
  opportunityId,
  demoPubkey,
}: {
  defaultTitle?: string;
  defaultUrl?: string;
  opportunityId?: string;
  demoPubkey?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [bounty, setBounty] = useState("12");
  const [poster, setPoster] = useState(demoPubkey ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    if (!isHttpUrl(url)) {
      setBusy(false);
      setError("URL must be http(s).");
      return;
    }
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url,
        bountyUsdc: Number(bounty),
        posterWallet: poster,
        opportunityId,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not post the task.");
      return;
    }
    setOpen(false);
    router.refresh();
    router.push("/tasks");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="pill">Post a task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bid the work</DialogTitle>
          <DialogDescription>
            Helix claims it, records the run, and settles 90/10 on the ledger.
            Any https URL works.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
          />
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
          />
          <Input
            value={bounty}
            onChange={(event) => setBounty(event.target.value)}
            placeholder="USDC bounty"
            type="number"
            min="1"
            step="0.1"
          />
          <WalletConnect demoPubkey={demoPubkey} onChange={setPoster} />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button size="pill" disabled={busy || !title || !url} onClick={() => void submit()}>
            {busy ? "Posting…" : "Release bounty"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
