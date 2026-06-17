import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { usePortalAuth } from "../auth/auth";
import { Button, Card, CardBody } from "./ui";
import type { Subscription } from "../api/types";

/**
 * Admin-only banner — shows the count of subscription requests waiting for
 * review, with a one-click path to /admin/subscriptions. Surfaced on Home
 * and Applications so admins notice pending work without having to remember
 * the route exists.
 *
 * Hidden entirely for non-admin users. Quiet when the queue is empty (no
 * "0 pending" noise on a healthy day).
 */
export default function PendingApprovalsBanner() {
  const auth = usePortalAuth();
  const isAdmin =
    auth.isAuthenticated &&
    (auth.roles.includes("api-admin") || auth.roles.includes("api-owner"));

  const { data } = useQuery({
    queryKey: ["admin", "subs", "pending-count"],
    queryFn: () => api.get<Subscription[]>("/api/admin/subscriptions?status=PENDING"),
    enabled: isAdmin,
    // Cheap refresh — the count drives banner visibility, so a stale value
    // for ~30s is fine; longer would risk reviewers missing fresh requests.
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (!isAdmin) return null;
  const count = data?.length ?? 0;
  if (count === 0) return null;

  return (
    <Card className="mb-6 border border-amber-200 bg-amber-50/60 animate-fade-up">
      <CardBody className="flex flex-wrap items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldAlert size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-semibold text-slate-900">
            {count === 1
              ? "1 subscription request waiting for review"
              : `${count} subscription requests waiting for review`}
          </div>
          <div className="text-sm text-slate-500">
            Review and approve so consumers receive their API keys.
          </div>
        </div>
        <Link to="/admin/subscriptions">
          <Button>
            Review now <ArrowUpRight size={15} />
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}
