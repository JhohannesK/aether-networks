import { getTask } from "@/lib/market/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) return Response.json({ error: "not found" }, { status: 404 });

  const headers = new Headers({
    "Content-Type": "application/json",
    "Payment-Protocol": "x402",
    "X-402-Asset": "USDC",
    "X-402-Network": "solana-devnet",
    "X-402-Amount": String(task.bountyUsdc),
    "X-402-Required": "false",
  });

  return new Response(
    JSON.stringify({
      task,
      result: task.resultJson ? JSON.parse(task.resultJson) : null,
      x402: {
        required: false,
        reason: "Dashboard reads are prepaid by the posted bounty. This header is advertised, not gated.",
      },
    }),
    { headers },
  );
}
