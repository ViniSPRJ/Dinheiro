"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

type PeriodSelectorProps = {
  periods: string[];
  selectedPeriod: string;
  onSelect: (period: string) => void;
  className?: string;
};

export function PeriodSelector({ periods, selectedPeriod, onSelect, className }: PeriodSelectorProps) {
  return (
    <div className={cn("inline-flex bg-surface p-1 rounded-lg border border-white/5", className)}>
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onSelect(period)}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
            selectedPeriod === period
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:text-text hover:bg-white/5"
          )}
        >
          {period}
        </button>
      ))}
      <div className="w-px bg-white/10 mx-1 my-1" />
      <button className="px-3 text-muted hover:text-primary transition-colors">
        <CalendarDays size={18} />
      </button>
    </div>
  );
}
