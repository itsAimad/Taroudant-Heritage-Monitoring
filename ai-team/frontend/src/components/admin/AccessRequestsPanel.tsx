import { useEffect, useState } from 'react';
import { accessRequestService, AccessRequest } from '@/services/accessRequestService';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const roleBadgeClass = (role: AccessRequest['role']) => {
  if (role === 'inspector') {
    return 'bg-blue-900/40 text-blue-300 border border-blue-800/30';
  }
  return 'bg-purple-900/40 text-purple-300 border border-purple-800/30';
};

const statusBadgeClass = (status: AccessRequest['status']) => {
  if (status === 'pending') return 'bg-amber-900/40 text-amber-300';
  if (status === 'approved') return 'bg-emerald-900/40 text-emerald-400';
  return 'bg-red-900/40 text-red-400';
};

const AccessRequestsPanel = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNoteById, setReviewNoteById] = useState<Record<string, string>>(
    {},
  );
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    let active = true;
    accessRequestService
      .getAllRequests()
      .then((data) => {
        if (active) setRequests(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApprove = async (id: string) => {
    try {
      const updated = await accessRequestService.updateRequestStatus(
        id,
        'approved',
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      showToast({
        type: 'success',
        message: `Approved access request for ${updated.fullName}.`,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to approve request. Please try again.',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const note = reviewNoteById[id];
      const updated = await accessRequestService.updateRequestStatus(
        id,
        'rejected',
        note,
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      showToast({
        type: 'success',
        message: `Rejected access request for ${updated.fullName}.`,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to reject request. Please try again.',
      });
    }
  };

  return (
    <div className="relative rounded-lg border border-border bg-card p-5">
      <Toast toasts={toasts} dismissToast={dismissToast} />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg text-foreground">
            Access Requests
          </h2>
          <p className="text-xs text-muted-foreground">
            Review pending access requests for inspectors and authorities.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
            {pendingCount} pending
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-6 text-sm text-muted-foreground">Loading requests…</p>
      ) : requests.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">
          No access requests have been submitted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-border/60 bg-background/60 p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">
                    {r.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.organization}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.email}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${roleBadgeClass(
                      r.role,
                    )}`}
                  >
                    {r.role}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${statusBadgeClass(
                      r.status,
                    )}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Submitted {relativeTime(r.submittedAt)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {r.reason}
              </p>

              {r.status === 'pending' && (
                <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(r.id)}
                      className="rounded-md border border-emerald-800/30 bg-emerald-900/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-900/50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(r.id)}
                      className="rounded-md border border-red-800/30 bg-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Optional review note for the requester…"
                    value={reviewNoteById[r.id] || ''}
                    onChange={(e) =>
                      setReviewNoteById((prev) => ({
                        ...prev,
                        [r.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessRequestsPanel;


