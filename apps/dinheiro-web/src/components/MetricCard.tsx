"use client";

import React from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function MetricCard({ title, value, subtitle, trend = "neutral", className }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted";

  return (
    <div className={cn("rounded-xl bg-surface p-4 shadow-md hover:shadow-lg transition-shadow duration-300", className)}>
      <div className="text-muted text-sm font-medium uppercase tracking-wide">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-text">{value}</div>
      {subtitle && <div className={cn("mt-1 text-sm font-medium", trendColor)}>{subtitle}</div>}
    </div>
  );
}
