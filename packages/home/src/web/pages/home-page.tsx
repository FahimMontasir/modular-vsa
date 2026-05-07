import { Button } from "@modular-vsa/ui/button";
import { toast } from "@modular-vsa/ui/sonner";

export function HomePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <Button onClick={() => toast("hello")}>Check</Button>
        </section>
      </div>
    </div>
  );
}
