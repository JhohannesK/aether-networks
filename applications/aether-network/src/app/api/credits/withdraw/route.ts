import { redirect } from "next/navigation";
import { withdrawCredits } from "@/lib/market/settlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    withdrawCredits(2.5);
  } catch {
    // empty surplus is fine
  }
  redirect("/agents");
}
