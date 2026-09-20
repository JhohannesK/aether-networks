import { enqueueHunt } from "@/lib/agents/fleet";
import { listOpportunities } from "@/lib/agents/hunters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ opportunities: listOpportunities() });
}

export async function POST() {
  enqueueHunt("nyx");
  enqueueHunt("vesper");
  return Response.json({ ok: true });
}
