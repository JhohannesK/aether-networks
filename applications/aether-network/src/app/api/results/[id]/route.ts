import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getTask } from "@/lib/market/tasks";
import {
  isPrepaidDashboardRequest,
  resultGate,
  resultPaymentHeaders,
} from "@/lib/market/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const task = getTask(id);
  const ledgerHasPayout = Boolean(
    task &&
      getDb()
        .select()
        .from(schema.ledger)
        .where(eq(schema.ledger.taskId, id))
        .all()
        .find((row) => row.type === "payout"),
  );

  const gate = resultGate({
    task,
    prepaidDashboard: isPrepaidDashboardRequest(request),
    ledgerHasPayout,
  });

  if (gate.status === 404) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    ...resultPaymentHeaders(
      { bountyUsdc: task!.bountyUsdc },
      gate.required,
    ),
  });

  if (gate.status === 402) {
    return new Response(
      JSON.stringify({
        error: "payment required",
        x402: { required: true, reason: gate.reason },
      }),
      { status: 402, headers },
    );
  }

  return new Response(
    JSON.stringify({
      task,
      result: task!.resultJson ? JSON.parse(task!.resultJson) : null,
      x402: { required: false, reason: gate.reason },
    }),
    { headers },
  );
}
