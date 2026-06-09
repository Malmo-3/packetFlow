import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, StarOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePackages } from "@/features/packages/usePackages";
import { listSavedTracking, removeTrackingCode } from "@/api/savedTracking";

export default function RecipientDashboard() {
  const { user } = useAuth();
  const { data: packages = [] } = usePackages();
  const [savedCodes, setSavedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setSavedCodes([]);
      return;
    }
    let cancelled = false;
    listSavedTracking(user.id).then((codes) => {
      if (!cancelled) setSavedCodes(codes);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const savedPackages = savedCodes.map((code) => ({
    code,
    pkg: packages.find((p) => p.trackingCode.toLowerCase() === code.toLowerCase()),
  }));

  const removeCode = async (code: string) => {
    if (!user) return;
    await removeTrackingCode(user.id, code);
    setSavedCodes((prev) => prev.filter((c) => c !== code));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved packages</h1>
          <p className="mt-1 text-muted-foreground">
            Keep your most important shipments one click away.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/recipient/track">
            <Search className="h-4 w-4" /> Track a package
          </Link>
        </Button>
      </header>

      {savedPackages.length === 0 ? (
        <Card className="bg-muted p-10 text-center">
          <p className="text-muted-foreground">You do not have any saved packages yet.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/recipient/track">
              <Search className="h-4 w-4" /> Find package by code
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedPackages.map(({ code, pkg }) => (
            <Card key={code} className="border-border bg-card p-5">
              {pkg ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-mono text-sm text-muted-foreground">{pkg.trackingCode}</div>
                    <h2 className="mt-1 text-lg font-bold">{pkg.recipientName}</h2>
                    <p className="text-sm text-muted-foreground">{pkg.recipientAddress}</p>
                    <div className="mt-2">
                      <span className="inline-flex rounded-full border border-border bg-secondary px-2 py-0.5 text-xs capitalize">
                        {pkg.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link to={`/track/${pkg.trackingCode}`}>Open tracking</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeCode(code)}>
                      <StarOff className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-mono text-sm text-muted-foreground">{code}</div>
                    <p className="text-sm text-muted-foreground">
                      This code no longer matches an available package.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeCode(code)}>
                    <StarOff className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
