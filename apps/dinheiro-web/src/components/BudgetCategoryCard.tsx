"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BudgetProps = {
  name: string;
  spent: number;
  limit: number;
  rollover?: number; // saldo transportado
  className?: string;
};

export function BudgetCategoryCard({ name, spent, limit, rollover = 0, className }: BudgetProps) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : spent > 0 ? 100 : 0;
  
  // Color logic: <80% primary, <100% warning, >=100% danger
  const barColor = pct <= 80 ? "bg-primary" : pct < 100 ? "bg-warning" : "bg-danger";

  return (
    <div className={cn("rounded-xl bg-surface p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-text font-medium">{name}</div>
        <div className="text-muted text-sm font-mono">
          {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} 
          <span className="mx-1 text-gray-600">/</span> 
          {limit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      </div>
      
      <div className="h-3 w-full rounded-full bg-bg overflow-hidden relative">
         {/* Background track handled by bg-bg */}
        <div 
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)} 
          style={{ width: `${pct}%` }} 
        />
      </div>

      {rollover !== 0 && (
        <div className="mt-2 text-xs text-muted font-medium">
          Rollover: {rollover > 0 ? "+" : ""}
          {rollover.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      )}
    </div>
  );
}
