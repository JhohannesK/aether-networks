import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="px-6 py-24 text-center">
        <p className="text-mint">404</p>
        <h1 className="mt-4 text-6xl">This session is gone.</h1>
        <Button asChild size="pill" className="mt-8">
          <Link href="/feed">Back to the floor</Link>
        </Button>
      </section>
    </main>
  );
}
