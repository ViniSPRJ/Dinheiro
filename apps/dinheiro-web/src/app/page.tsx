"use client";

import React, { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { BudgetCategoryCard } from "@/components/BudgetCategoryCard";
import { BenchmarkTile } from "@/components/BenchmarkTile";
import { TransactionRow } from "@/components/TransactionRow";
import { CashFlowChart } from "@/components/CashFlowChart";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Bell, Search, Settings, Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Jan 2026");
  const { transactions, budgets, cashFlow, metrics, isLoading } = useDashboardData(selectedPeriod);

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-bg text-muted">
              <Loader2 className="animate-spin mr-2" /> Carregando Dinheiro...
          </div>
      )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Visão Geral</h1>
          <p className="text-muted">Bem-vindo de volta, Vinicius</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector 
             periods={["Dez 2025", "Jan 2026", "Fev 2026"]} 
             selectedPeriod={selectedPeriod}
             onSelect={setSelectedPeriod}
          />
          <button className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-text transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-bg"></span>
          </button>
           <button className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-text transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
            <MetricCard key={m.title} title={m.title} value={m.value} subtitle={m.subtitle} trend={m.trend} />
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: CashFlow & Budgets */}
        <div className="lg:col-span-2 space-y-8">
          
          <CashFlowChart data={cashFlow} />

          <section>
             <h3 className="text-xl font-semibold mb-4 text-text">Orçamentos Ativos</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((b) => (
                    <BudgetCategoryCard key={b.id} name={b.name} spent={b.spent} limit={b.limit} rollover={b.rollover} />
                ))}
             </div>
          </section>

           <section>
             <h3 className="text-xl font-semibold mb-4 text-text">Transações Recentes</h3>
             <div className="bg-surface rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-white/5 flex gap-2">
                    <Search className="text-muted" size={20} />
                    <input type="text" placeholder="Buscar transações..." className="bg-transparent border-none outline-none text-text w-full placeholder:text-muted/50" />
                </div>
                <div className="divide-y divide-white/5">
                    {transactions.map((t) => (
                        <TransactionRow 
                           key={t.id} 
                           description={t.description} 
                           category={t.category} 
                           amount={t.amount} 
                           date={t.date} 
                           hasNote={t.hasNote} 
                        />
                    ))}
                </div>
             </div>
          </section>
        </div>

        {/* Right Column: Benchmark & Insights */}
        <div className="space-y-8">
           <section>
              <h3 className="text-xl font-semibold mb-4 text-text">Benchmarks</h3>
              <div className="space-y-4">
                  <BenchmarkTile accountReturnYTD={12.4} indexReturnYTD={10.2} indexLabel="CDI" />
                  <BenchmarkTile accountReturnYTD={12.4} indexReturnYTD={14.5} indexLabel="IBOVESPA" />
                  <BenchmarkTile accountReturnYTD={12.4} indexReturnYTD={18.2} indexLabel="S&P 500" />
              </div>
           </section>

           <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <h4 className="font-bold text-primary mb-2">Insight do Mês</h4>
              <p className="text-sm text-muted">Seus gastos com <span className="text-text font-medium">Alimentação</span> estão 15% menores que a média dos últimos 3 meses.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
