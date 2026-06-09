import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCreatePackage } from "@/features/packages/usePackages";
import { toast } from "@/hooks/use-toast";

interface CsvRow {
  recipientName: string;
  pickupCity: string;
  destinationCity: string;
  deliveryAddress: string;
  weightKg: string | number;
  length?: string | number;
  width?: string | number;
  height?: string | number;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {} as CsvRow;
    headers.forEach((h, i) => {
      (row as any)[h] = cells[i];
    });
    return row;
  });
}

export function BatchImport({ onImported }: { onImported?: (count: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const createPackage = useCreatePackage();
  const [preview, setPreview] = useState<CsvRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      const rows = file.name.endsWith(".json") ? (JSON.parse(text) as CsvRow[]) : parseCsv(text);
      setPreview(rows);
    } catch {
      toast({ title: "Could not parse file", description: "Use CSV headers or a JSON array.", variant: "destructive" });
    }
  };

  const confirmImport = async () => {
    if (!preview || !user) return;
    setImporting(true);
    let created = 0;
    let failed = 0;

    for (const row of preview) {
      try {
        await createPackage.mutateAsync({
          senderName: user.name,
          recipientName: row.recipientName ?? "Unknown",
          pickupCity: row.pickupCity ?? "",
          destinationCity: row.destinationCity ?? "",
          deliveryAddress: row.deliveryAddress ?? "",
          weight: Number(row.weightKg) || 1,
          dimensions: {
            length: Number(row.length) || 20,
            width: Number(row.width) || 15,
            height: Number(row.height) || 10,
          },
        });
        created += 1;
      } catch {
        failed += 1;
      }
    }

    setImporting(false);
    if (failed === 0) {
      toast({ title: `Imported ${created} packages` });
    } else {
      toast({
        title: `Imported ${created}, ${failed} failed`,
        description: "Check the console for server errors.",
        variant: "destructive",
      });
    }
    setPreview(null);
    onImported?.(created);
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <Upload className="h-4 w-4 text-muted-foreground" />
            Batch import
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload CSV (with headers) or JSON array. Required:{" "}
            <code className="font-mono text-xs">recipientName, pickupCity, destinationCity, deliveryAddress, weightKg</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </div>
      </div>

      {preview && (
        <div className="mt-5 space-y-3">
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Recipient</th>
                  <th className="px-3 py-2 text-left">Destination</th>
                  <th className="px-3 py-2 text-left">Weight</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{row.recipientName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.deliveryAddress}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.weightKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{preview.length} rows ready</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)} disabled={importing}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirmImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${preview.length}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
