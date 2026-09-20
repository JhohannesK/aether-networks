import { isLiveSolari } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    mode: isLiveSolari() ? "live" : "mock",
  });
}
