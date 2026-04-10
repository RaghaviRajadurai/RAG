import React from "react";
import { cn } from "../utils/cn.js";

function AnimatedBlob({ className }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute aspect-square w-[480px] rounded-full bg-primary/30 blur-3xl",
        "animate-blob mix-blend-screen",
        className
      )}
    />
  );
}

function AceternityBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-radial-grid bg-[size:32px_32px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,156,245,0.15),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),transparent_55%)]" />
      <AnimatedBlob className="-left-40 -top-40" />
      <AnimatedBlob className="right-[-260px] top-[20%]" />
      <AnimatedBlob className="bottom-[-260px] left-[20%]" />
    </div>
  );
}

export { AceternityBackground };
