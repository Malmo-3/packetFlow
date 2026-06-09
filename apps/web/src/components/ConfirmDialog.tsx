/**
 * ConfirmDialog — an in-app confirmation modal.
 *
 * Replaces the native `window.confirm()` browser popup with a styled dialog
 * that matches the rest of the app. Controlled via the `open` prop; closing
 * (via Cancel, the overlay, or Esc) calls `onCancel`.
 *
 * Usage:
 * ```tsx
 * const [target, setTarget] = useState<Item | null>(null);
 * <ConfirmDialog
 *   open={Boolean(target)}
 *   title="Delete trip?"
 *   description={`"${target?.name}" will be permanently removed.`}
 *   confirmLabel="Delete"
 *   destructive
 *   pending={isPending}
 *   onConfirm={() => doDelete(target!)}
 *   onCancel={() => setTarget(null)}
 * />
 * ```
 */
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive (red) action. */
  destructive?: boolean;
  /** Shows a spinner and disables the buttons while the action runs. */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !pending) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
