import React from "react";
import { cn } from "@/utils";

export function Card({ className = "", ...props }) {
  return <div className={cn("bg-white border border-slate-200", className)} {...props} />;
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cn("p-6 pb-2", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("p-6 pt-2", className)} {...props} />;
}
