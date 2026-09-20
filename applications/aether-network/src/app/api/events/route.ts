import { eventsAfter, recentEvents } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const last = Number(url.searchParams.get("last") ?? "0");
  let cursor = last || (recentEvents(1)[0]?.id ?? 0);

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const rows = eventsAfter(cursor);
        for (const row of rows) {
          cursor = row.id;
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(row)}\n\n`),
          );
        }
      };
      send();
      const timer = setInterval(send, 1000);
      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text-event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
