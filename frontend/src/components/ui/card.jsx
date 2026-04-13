import React from "react";
import { cn } from "../../utils/cn.js";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        "relative overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 px-6 pt-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-slate-900",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-600 pb-2", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div className={cn("px-6 pb-6 pt-2 text-sm text-slate-900", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
