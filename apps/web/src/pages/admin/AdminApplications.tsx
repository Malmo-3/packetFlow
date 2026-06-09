import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  approveCarrierApplication,
  listCarrierApplications,
  rejectCarrierApplication,
  type CarrierApplication,
} from "@/api/carrierApplications";

export default function AdminApplications() {
  const [applications, setApplications] = useState<CarrierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listCarrierApplications("pending")
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const decide = async (
    id: string,
    action: "approve" | "reject",
  ): Promise<void> => {
    setBusyId(id);
    try {
      if (action === "approve") {
        await approveCarrierApplication(id);
        toast({ title: "Carrier approved", description: "Account created." });
      } else {
        await rejectCarrierApplication(id);
        toast({ title: "Application rejected" });
      }
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Carrier applications</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve prospective carriers.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending applications.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{a.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {a.email} · {a.phone} · {a.vehicle}
                  {a.address ? ` · ${a.address}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === a.id}
                  onClick={() => decide(a.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={busyId === a.id}
                  onClick={() => decide(a.id, "approve")}
                >
                  Approve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
