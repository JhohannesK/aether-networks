import { getSession } from "@/lib/agents/hunters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({
    id: session.id,
    replayUrl: session.replayUrl,
    mode: session.mode,
    timeline: JSON.parse(session.timelineJson),
    htmlExcerpt: session.htmlExcerpt,
  });
}
