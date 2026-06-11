/**
 * Imperative dialog store.
 *
 * `notify` / `confirmAction` can be called from anywhere (no hook needed); they
 * enqueue a request that the mounted <DialogHost /> renders as a themed in-app
 * modal. This replaces the native `Alert`/`window.alert` so messages and
 * confirmations look the same on web and native.
 */
export interface DialogRequest {
  id: number;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  /** true = confirm (shows Cancel + confirm); false = notice (single button). */
  isConfirm: boolean;
  onConfirm?: () => void;
}

type Listener = (queue: DialogRequest[]) => void;

let queue: DialogRequest[] = [];
let listeners: Listener[] = [];
let counter = 0;

function emit() {
  const snapshot = [...queue];
  listeners.forEach((l) => l(snapshot));
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  listener([...queue]);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function dismiss(id: number) {
  queue = queue.filter((d) => d.id !== id);
  emit();
}

/** Show a simple message with a single dismiss button. */
export function notify(title: string, message?: string): void {
  queue.push({
    id: ++counter,
    title,
    message,
    confirmLabel: "OK",
    cancelLabel: "Cancel",
    destructive: false,
    isConfirm: false,
  });
  emit();
}

/** Ask the user to confirm; runs `onConfirm` only if they accept. */
export function confirmAction(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  queue.push({
    id: ++counter,
    title: opts.title,
    message: opts.message,
    confirmLabel: opts.confirmLabel ?? "Confirm",
    cancelLabel: opts.cancelLabel ?? "Cancel",
    destructive: opts.destructive ?? false,
    isConfirm: true,
    onConfirm: opts.onConfirm,
  });
  emit();
}
