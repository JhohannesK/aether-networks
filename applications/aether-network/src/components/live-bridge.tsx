"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveBridge() {
  const router = useRouter();
  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = () => router.refresh();
    return () => source.close();
  }, [router]);
  return null;
}
