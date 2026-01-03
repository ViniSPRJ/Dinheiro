"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { StickyNote } from "lucide-react";

type TransactionProps = {
  description: string;
  category: string;
  amount: number;
  date: string;
  hasNote?: boolean;
  className?: string;
};

export function TransactionRow({ description, category, amount, date, hasNote, className }: TransactionProps) {
  return (
    <div className={cn("group flex items-center justify-between py-4 px-4 hover:bg-white/5 rounded-lg transition-colors cursor-pointer", className)}>
      <div className="flex items-center gap-4">
        {/* Placeholder Icon based on category or first letter */}
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
            {description.charAt(0).toUpperCase()}
        </div>
        
        <div>
          <div className="text-text font-medium text-sm md:text-base leading-tight">{description}</div>
          <div className="text-muted text-xs mt-1 flex items-center gap-2">
             <span>{category}</span>
             <span className="w-1 h-1 rounded-full bg-gray-600"></span>
             <span>{date}</span>
             {hasNote && <StickyNote size={12} className="text-yellow-500" />}
          </div>
        </div>
      </div>
      
      <div className={cn("font-semibold text-sm md:text-base", amount > 0 ? "text-success" : "text-text")}>
        {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </div>
    </div>
  );
}
