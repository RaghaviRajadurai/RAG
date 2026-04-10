import React from "react";
import { cn } from "../../utils/cn.js";

function Spinner({ className }) {
  return (
    <div
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/80 shadow-lg shadow-slate-950/70",
        "before:block before:h-6 before:w-6 before:rounded-full before:border-2 before:border-primary/80 before:border-t-transparent before:animate-slow-spin",
        className
      )}
    />
  );
}

export { Spinner };
