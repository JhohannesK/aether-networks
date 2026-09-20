import { createTask, listTasks } from "@/lib/market/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ tasks: listTasks() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    url?: string;
    bountyUsdc?: number;
    posterWallet?: string;
    opportunityId?: string;
  };
  if (!body.title || !body.url) {
    return Response.json({ error: "title and url required" }, { status: 400 });
  }
  const task = createTask({
    title: body.title,
    url: body.url,
    bountyUsdc: Number(body.bountyUsdc) > 0 ? Number(body.bountyUsdc) : 10,
    posterWallet: body.posterWallet,
    opportunityId: body.opportunityId,
  });
  return Response.json({ task });
}
