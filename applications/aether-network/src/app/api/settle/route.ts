import { settleTask } from "@/lib/market/settlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { taskId?: string };
  if (!body.taskId) {
    return Response.json({ error: "taskId required" }, { status: 400 });
  }
  const result = await settleTask(body.taskId);
  return Response.json({ result });
}
