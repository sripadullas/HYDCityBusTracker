import React from "react";
import { cn } from "@/utils";

export function Button({ className = "", variant = "default", ...props }) {
  const variants = {
    default: "bg-slate-900 text-white hover:opacity-90",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
  };

  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition", variants[variant], className)}
      {...props}
    />
  );
}
