import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getPackageByCode } from "@/features/packages/packagesApi";

/** Force the value to always carry the `PKT-` prefix; the user only edits the suffix. */
function withPktPrefix(input: string): string {
  const suffix = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^PKT/, "");
  return `PKT-${suffix}`;
}

export default function RecipientTrack() {
  const navigate = useNavigate();
  const [code, setCode] = useState("PKT-");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const pkg = await getPackageByCode(code);
      if (!pkg) {
        setError("No package found with this code.");
        return;
      }
      navigate(`/track/${pkg.trackingCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not look up that code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Track a package</h1>
        <p className="mt-1 text-muted-foreground">Enter the tracking code shared by the sender.</p>
      </div>

      <Card className="border-border bg-card p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 font-mono uppercase"
              placeholder="PKT-XXXXXXXX"
              value={code}
              onChange={(e) => { setCode(withPktPrefix(e.target.value)); setError(null); }}
            />
          </div>
          {error && (
            <div className="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          )}
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? "Looking up..." : "Track"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Tracking codes start with <span className="font-mono text-foreground">PKT-</span> followed by 8 characters — find yours in your confirmation email or ask the sender.
        </p>
      </Card>
    </div>
  );
}
