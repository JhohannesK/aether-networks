import { listHunters, listSessions } from "@/lib/agents/hunters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ hunters: listHunters(), sessions: listSessions() });
}
