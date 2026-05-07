import { AnimatePresence, motion } from "framer-motion";
import useToastStore from "../../store/toastStore";

const VARIANTS = {
  success: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
  },
  error: {
    border: "border-rose-500/50",
    bg: "bg-rose-500/10",
    text: "text-rose-200",
  },
  info: {
    border: "border-slate-500/50",
    bg: "bg-slate-500/10",
    text: "text-slate-100",
  },
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[999] flex w-full max-w-xs flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = VARIANTS[toast.variant] || VARIANTS.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 10, y: -6 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-md border px-3 py-2 shadow-lg backdrop-blur ${style.border} ${style.bg}`}
              role="status"
              onClick={() => removeToast(toast.id)}
            >
              <p className={`text-[12px] font-medium ${style.text}`}>
                {toast.message}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
