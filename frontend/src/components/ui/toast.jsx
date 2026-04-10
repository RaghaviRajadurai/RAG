import * as React from "react";
import { cn } from "../../utils/cn.js";

function Toast({ variant = "default", title, description }) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-slate-950/70 backdrop-blur-xl",
        variant === "error"
          ? "border-red-500/70 bg-red-950/80 text-red-50"
          : "border-emerald-500/70 bg-emerald-950/80 text-emerald-50"
      )}
    >
      <div className="flex flex-1 flex-col">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && (
          <p className="mt-0.5 text-xs text-slate-200/90">{description}</p>
        )}
      </div>
    </div>
  );
}

function Toaster() {
  // Placeholder, real implementation is in ToastContext.
  return null;
}

export { Toast, Toaster };
