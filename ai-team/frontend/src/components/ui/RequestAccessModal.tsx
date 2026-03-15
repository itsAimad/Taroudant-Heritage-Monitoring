import { useState, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { accessRequestService } from '@/services/accessRequestService';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RequestAccessModal = ({ isOpen, onClose }: RequestAccessModalProps) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    role: '',
    reason: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<typeof form> = {};
    if (!form.fullName || form.fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name.';
    }
    if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.organization || form.organization.trim().length < 2) {
      nextErrors.organization = 'Please enter your organization.';
    }
    if (!form.role) {
      nextErrors.role = 'Please choose a requested role.';
    }
    if (!form.reason || form.reason.trim().length < 20) {
      nextErrors.reason = 'Please provide at least 20 characters explaining your request.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      email: '',
      organization: '',
      role: '',
      reason: '',
    });
    setErrors({});
    setStatus('idle');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('loading');
    try {
      await accessRequestService.submitRequest({
        fullName: form.fullName,
        email: form.email,
        organization: form.organization,
        role: form.role as 'inspector' | 'authority',
        reason: form.reason,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const handleClose = () => {
    if (status === 'loading') return;
    resetForm();
    onClose();
  };

  const charCount = form.reason.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-sand/10 bg-[#1a1208] p-8 shadow-2xl shadow-black/60 flex flex-col"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 p-[11px] items-center justify-center rounded-full bg-copper-light/10">
                  <Shield className="h-5 w-5 text-copper-light" />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-sand-light">
                    Request System Access
                  </h2>
                  <p className="mt-1 text-xs text-sand/45">
                    For heritage inspectors and regional authority staff who need access to the monitoring system.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={status === 'loading'}
                className="text-sand/30 hover:text-sand/70 transition-colors disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 mb-6 border-b border-sand/8" />

            {status === 'success' ? (
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-copper-light/60"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="h-9 w-9 text-copper-light"
                  >
                    <motion.path
                      d="M5 13.5L9.5 18L19 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                  </motion.svg>
                </motion.div>

                <h3 className="font-heading text-2xl text-sand-light">
                  Request Submitted
                </h3>
                <p className="mt-3 max-w-sm text-sm text-sand/60">
                  Your access request has been received. The system administrator will review your request
                  and respond to <span className="text-sand-light">{form.email}</span> within 48 hours.
                </p>

                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 w-full rounded-md bg-copper-light px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-copper-light/90 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <motion.div
                  animate={
                    errors.fullName
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <label className="block text-xs font-medium tracking-[0.18em] text-sand/50 uppercase mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className={`w-full rounded-md border border-sand/10 bg-sand/5 px-4 py-2.5 text-sm text-sand placeholder:text-sand/25 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-colors duration-200 ${errors.fullName ? 'border-red-500/50 bg-red-950/10' : ''
                      }`}
                    placeholder="e.g. Fatima Zahra El Idrissi"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-400/80">
                      {errors.fullName}
                    </p>
                  )}
                </motion.div>

                {/* Email */}
                <motion.div
                  animate={
                    errors.email
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <label className="block text-xs font-medium tracking-[0.18em] text-sand/50 uppercase mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full rounded-md border border-sand/10 bg-sand/5 px-4 py-2.5 text-sm text-sand placeholder:text-sand/25 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-colors duration-200 ${errors.email ? 'border-red-500/50 bg-red-950/10' : ''
                      }`}
                    placeholder="you@example.org"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400/80">
                      {errors.email}
                    </p>
                  )}
                </motion.div>

                {/* Organization */}
                <motion.div
                  animate={
                    errors.organization
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <label className="block text-xs font-medium tracking-[0.18em] text-sand/50 uppercase mb-1.5">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={(e) => handleChange('organization', e.target.value)}
                    className={`w-full rounded-md border border-sand/10 bg-sand/5 px-4 py-2.5 text-sm text-sand placeholder:text-sand/25 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-colors duration-200 ${errors.organization ? 'border-red-500/50 bg-red-950/10' : ''
                      }`}
                    placeholder="e.g. Regional Heritage Office"
                  />
                  {errors.organization && (
                    <p className="mt-1 text-xs text-red-400/80">
                      {errors.organization}
                    </p>
                  )}
                </motion.div>

                {/* Role */}
                <motion.div
                  animate={
                    errors.role
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <label className="block text-xs font-medium tracking-[0.18em] text-sand/50 uppercase mb-1.5">
                    Requested Role
                  </label>
                  <div className="relative">
                    <select
                      value={form.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className={`w-full appearance-none rounded-md border border-sand/10 bg-sand/5 px-4 py-2.5 pr-10 text-sm text-sand placeholder:text-sand/25 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-colors duration-200 ${errors.role ? 'border-red-500/50 bg-red-950/10' : ''
                        }`}
                    >
                      <option value="">Select a role…</option>
                      <option value="inspector">
                        Inspector — Field survey access
                      </option>
                      <option value="authority">
                        Authority — Reports &amp; alerts access
                      </option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand/40" />
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-xs text-red-400/80">
                      {errors.role}
                    </p>
                  )}
                </motion.div>

                {/* Reason */}
                <motion.div
                  animate={
                    errors.reason
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <label className="block text-xs font-medium tracking-[0.18em] text-sand/50 uppercase mb-1.5">
                    Reason / Message
                  </label>
                  <div className="relative">
                    <textarea
                      value={form.reason}
                      onChange={(e) =>
                        handleChange('reason', e.target.value.slice(0, 500))
                      }
                      rows={4}
                      className={`w-full rounded-md border border-sand/10 bg-sand/5 px-4 py-2.5 text-sm text-sand placeholder:text-sand/25 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-colors duration-200 resize-none ${errors.reason ? 'border-red-500/50 bg-red-950/10' : ''
                        }`}
                      placeholder="Explain why you need access, which monuments or zones you are responsible for, and any relevant project or mandate."
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] font-mono text-sand/35">
                      {charCount} / 500
                    </span>
                  </div>
                  {errors.reason && (
                    <p className="mt-1 text-xs text-red-400/80">
                      {errors.reason}
                    </p>
                  )}
                </motion.div>

                {/* Error banner */}
                {status === 'error' && (
                  <div className="mt-2 rounded-md border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                    Something went wrong. Please try again or contact the administrator.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="mt-4 w-full rounded-md bg-copper-light px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-copper-light/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal/30 border-t-charcoal" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RequestAccessModal;


