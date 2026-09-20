"use client";

import { Button } from "@/components/ui/button";

export default function ErrorView({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-mint">Something broke</p>
      <h1 className="mt-4 text-5xl">The floor went dark.</h1>
      <Button size="pill" className="mt-8" onClick={reset}>
        Retry
      </Button>
    </main>
  );
}
