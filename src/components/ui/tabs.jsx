import React, { createContext, useContext, useState } from "react";
import { cn } from "@/utils";

const TabsContext = createContext();

export function Tabs({ defaultValue, children, className = "" }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", ...props }) {
  return <div className={cn("bg-slate-100 p-1", className)} {...props} />;
}

export function TabsTrigger({ value, children, className = "" }) {
  const { value: current, setValue } = useContext(TabsContext);
  const active = current === value;

  return (
    <button
      onClick={() => setValue(value)}
      className={cn(
        "px-4 py-2 text-sm rounded-xl transition",
        active ? "bg-white shadow-sm font-medium" : "text-slate-600",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const { value: current } = useContext(TabsContext);
  if (current !== value) return null;
  return <div className={cn(className)}>{children}</div>;
}
