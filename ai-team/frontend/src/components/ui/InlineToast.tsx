import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { ToastItem } from "@/hooks/useToast";

interface InlineToastProps {
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const InlineToast = ({ toasts, dismissToast }: InlineToastProps) => {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toast.type === "success" ? CheckCircle2 : XCircle;
          const iconColor =
            toast.type === "success" ? "text-emerald-400" : "text-red-400";
          const borderColor =
            toast.type === "success"
              ? "border-emerald-700/40"
              : "border-red-800/40";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex min-w-[280px] max-w-[360px] items-start gap-3 rounded-lg border bg-[#1a1208] px-5 py-3.5 shadow-xl shadow-black/40 ${borderColor}`}
            >
              <div className="mt-0.5">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1 text-sm text-sand/80">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="ml-2 text-sand/30 transition-colors hover:text-sand/60"
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default InlineToast;


