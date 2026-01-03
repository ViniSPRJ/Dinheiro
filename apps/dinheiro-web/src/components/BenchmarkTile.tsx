"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type BenchmarkProps = { 
  accountReturnYTD: number; 
  indexReturnYTD: number; 
  indexLabel: string;
  className?: string;
};

export function BenchmarkTile({ accountReturnYTD, indexReturnYTD, indexLabel, className }: BenchmarkProps) {
  const diff = accountReturnYTD - indexReturnYTD;
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
  
  const badgeColor = trend === "up" ? "text-success bg-success/10" : trend === "down" ? "text-danger bg-danger/10" : "text-muted bg-gray-500/10";
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={cn("rounded-xl bg-surface p-5 shadow-sm border border-white/5", className)}>
      <div className="text-muted text-xs font-bold uppercase tracking-wider mb-3">Comparado a {indexLabel}</div>
      
      <div className="flex items-baseline justify-between">
        <div>
           <div className="text-sm text-muted mb-1">Você</div>
           <div className="text-2xl font-bold text-text">{accountReturnYTD.toFixed(2)}%</div>
        </div>
        <div className="text-right">
           <div className="text-sm text-muted mb-1">{indexLabel}</div>
           <div className="text-xl font-semibold text-muted">{indexReturnYTD.toFixed(2)}%</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", badgeColor)}>
            <Icon size={14} />
            <span>{trend === "up" ? "Acima" : trend === "down" ? "Abaixo" : "Igual"} por {Math.abs(diff).toFixed(2)} pp</span>
        </div>
      </div>
    </div>
  );
}
