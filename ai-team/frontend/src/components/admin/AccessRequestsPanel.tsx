import { useCallback, useEffect, useState } from 'react';
import { accessRequestService, AccessRequest } from '@/services/accessRequestService';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

const relativeTime = (iso: string) => {
  if (!iso) return 'unknown';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'unknown';
  const diff = Date.now() - t;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const roleBadgeClass = (roleId: number) => {
  if (roleId === 2) {
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewNoteById, setReviewNoteById] = useState<Record<number, string>>(
    {},
  );
  const { toasts, showToast, dismissToast } = useToast();

  const loadRequests = useCallback((cancelRef?: { cancelled: boolean }) => {
    setLoading(true);
    setLoadError(null);
    accessRequestService
      .getAllRequests()
      .then((data) => {
        if (cancelRef?.cancelled) return;
        setRequests(data);
      })
      .catch((err) => {
        if (cancelRef?.cancelled) return;
        console.error('Failed to fetch requests:', err);
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load access requests.',
        );
      })
      .finally(() => {
        if (!cancelRef?.cancelled) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const cancelRef = { cancelled: false };
    loadRequests(cancelRef);
    return () => {
      cancelRef.cancelled = true;
    };
  }, [loadRequests]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApprove = async (id: number) => {
    const fullName = requests.find((r) => r.id === id)?.full_name;
    try {
      await accessRequestService.approveRequest(id, reviewNoteById[id]);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)),
      );
      showToast({
        type: 'success',
        message: `Approved access request for ${fullName ?? 'requester'}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Failed to approve request. Please try again.',
      });
    }
  };

  const handleReject = async (id: number) => {
    const note = reviewNoteById[id];
    if (!note || note.trim().length < 5) {
      showToast({
        type: 'error',
        message: 'Please provide a reason (at least 5 chars) for rejection.',
      });
      return;
    }

    const fullName = requests.find((r) => r.id === id)?.full_name;
    try {
      await accessRequestService.rejectRequest(id, note);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)),
      );
      showToast({
        type: 'success',
        message: `Rejected access request for ${fullName ?? 'requester'}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Failed to reject request. Please try again.',
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
      ) : loadError ? (
        <div className="py-6">
          <p className="text-sm text-destructive">{loadError}</p>
          <button
            type="button"
            onClick={() => loadRequests()}
            className="mt-3 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 transition-colors"
          >
            Retry
          </button>
        </div>
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
                    {r.full_name}
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
                      r.requested_role_id,
                    )}`}
                  >
                    {r.role_name || 'unknown'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${statusBadgeClass(
                      r.status,
                    )}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Submitted {relativeTime(r.submitted_at)}
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
