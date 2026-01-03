"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

type CashFlowData = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export function CashFlowChart({ data, className }: { data: CashFlowData[], className?: string }) {
  return (
    <div className={cn("h-72 rounded-xl bg-surface p-4 shadow-sm relative", className)}>
      <h3 className="text-muted text-sm font-bold uppercase tracking-wider mb-4">Fluxo de Caixa (Últimos meses)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A303C" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: "#98A2B3", fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fill: "#98A2B3", fontSize: 12 }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: "#141821", border: "1px solid #2A303C", borderRadius: "8px" }}
             itemStyle={{ color: "#E6E8EA" }}
             cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="income" name="Renda" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
