import { Badge, type BadgeTone } from "@/components/ui/badge";
import { requestStatusLabels } from "@/lib/format";
import type { Database } from "@/types/database";

type RequestStatus = Database["public"]["Enums"]["request_status"];

const TONES: Record<RequestStatus, BadgeTone> = {
  open: "brand",
  awarded: "info",
  fulfilled: "success",
  cancelled: "muted",
  expired: "muted",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={TONES[status]}>{requestStatusLabels[status]}</Badge>;
}
