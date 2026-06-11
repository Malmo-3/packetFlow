import { statusLabels } from "@packetflow/types";
import type { PackageStatus } from "@packetflow/types";
import { useTheme } from "../theme/ThemeProvider";
import { statusStyles } from "../theme/tokens";
import { Badge } from "./ui";

export function StatusBadge({ status }: { status: PackageStatus }) {
  const { theme } = useTheme();
  const s = statusStyles[theme][status] ?? statusStyles[theme].registered;
  return <Badge text={statusLabels[status] ?? status} bg={s.bg} color={s.text} />;
}

export default StatusBadge;
