import { useState } from 'react';
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { usePortfolioReview, useUpdateRiskProfile } from '../../hooks/useAdvisor';
import type { RiskProfile } from '../../services/advisor.service';

const RISK_PROFILES: { value: RiskProfile; label: string }[] = [
  { value: 'conservador', label: 'Conservador' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'arrojado', label: 'Arrojado' },
];

const ACTION_STYLES: Record<string, string> = {
  COMPRAR: 'bg-success-100 text-success-700',
  VENDER: 'bg-danger-100 text-danger-700',
  MANTER: 'bg-gray-100 text-gray-600',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatWeight = (value: number) => `${(value * 100).toFixed(1)}%`;

function scoreColor(score: number) {
  if (score >= 75) return 'text-success-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-danger-600';
}

export default function PortfolioAdvisorCard() {
  // Local preview profile override (does not persist until applied).
  const [previewProfile, setPreviewProfile] = useState<RiskProfile | undefined>(undefined);
  const { data, isLoading, isError } = usePortfolioReview(previewProfile);
  const updateProfile = useUpdateRiskProfile();

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="mt-4 h-24 w-full rounded bg-gray-100" />
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  const activeProfile = previewProfile ?? data.riskProfile;

  if (!data.available || !data.review) {
    return (
      <div className="card border-l-4 border-indigo-300">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">Consultor OpenSwarm</h2>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {data.message ?? 'Consultor indisponível no momento.'}
        </p>
      </div>
    );
  }

  const { review } = data;
  const assetClasses = Array.from(
    new Set([
      ...Object.keys(review.current_allocation),
      ...Object.keys(review.proposed_allocation),
    ])
  );

  const topActions = review.rebalancing_actions
    .filter((a) => a.action !== 'MANTER')
    .slice(0, 5);

  return (
    <div className="card border-l-4 border-indigo-500 bg-gradient-to-r from-white to-indigo-50/40">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">Consultor OpenSwarm</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium uppercase text-indigo-700">
              IA
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{review.summary}</p>
        </div>

        {/* Score */}
        <div className="text-center">
          <p className="text-xs uppercase text-gray-500">Saúde da Carteira</p>
          <p className={clsx('text-3xl font-bold', scoreColor(review.diagnosis.score))}>
            {review.diagnosis.score}
            <span className="text-base font-medium text-gray-400">/100</span>
          </p>
        </div>
      </div>

      {/* Risk profile selector */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Perfil:</span>
        {RISK_PROFILES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreviewProfile(p.value)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeProfile === p.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {p.label}
          </button>
        ))}
        {previewProfile && previewProfile !== data.riskProfile && (
          <button
            type="button"
            onClick={() => updateProfile.mutate(previewProfile)}
            disabled={updateProfile.isPending}
            className="ml-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            Salvar perfil
          </button>
        )}
      </div>

      {/* Expected metrics */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-white/70 p-3">
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <p className="text-[10px] uppercase">Retorno esp.</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {review.expected_metrics.expected_return_pct.toFixed(1)}%
          </p>
          <p className="text-[10px] text-gray-400">
            atual {review.current_metrics.expected_return_pct.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/70 p-3">
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <p className="text-[10px] uppercase">Volatilidade</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {review.expected_metrics.expected_volatility_pct.toFixed(1)}%
          </p>
          <p className="text-[10px] text-gray-400">
            atual {review.current_metrics.expected_volatility_pct.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/70 p-3">
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <ArrowsRightLeftIcon className="h-4 w-4" />
            <p className="text-[10px] uppercase">Diversificação</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {(review.expected_metrics.diversification * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-gray-400">
            atual {(review.current_metrics.diversification * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Allocation comparison: current vs proposed */}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Alocação atual vs. otimizada
        </h3>
        <div className="space-y-3">
          {assetClasses.map((cls) => {
            const current = review.current_allocation[cls] ?? 0;
            const proposed = review.proposed_allocation[cls] ?? 0;
            return (
              <div key={cls}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{cls}</span>
                  <span className="text-gray-500">
                    {formatWeight(current)} → <span className="font-medium text-indigo-600">{formatWeight(proposed)}</span>
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  {/* current (gray) */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gray-300"
                    style={{ width: `${Math.min(current * 100, 100)}%` }}
                  />
                  {/* proposed (indigo) */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-indigo-500/70"
                    style={{ width: `${Math.min(proposed * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rebalancing actions */}
      {topActions.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Ações sugeridas</h3>
          <div className="space-y-2">
            {topActions.map((a) => (
              <div
                key={a.asset_class}
                className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'rounded px-2 py-0.5 text-[10px] font-bold',
                      ACTION_STYLES[a.action]
                    )}
                  >
                    {a.action}
                  </span>
                  <span className="text-gray-700">{a.asset_class}</span>
                </div>
                <span className="text-gray-600">
                  {a.delta_pct > 0 ? '+' : ''}
                  {a.delta_pct.toFixed(1)} p.p. ({formatCurrency(Math.abs(a.amount))})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {review.insights.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1">
            <LightBulbIcon className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Insights</h3>
          </div>
          <ul className="space-y-1.5">
            {review.insights.map((insight, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer: proposal id + tax note */}
      <div className="mt-5 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">{review.tax_implications}</p>
        {review.proposal_id && (
          <p className="mt-2 text-[11px] text-gray-400">
            Proposta registrada (Advisor-as-Git):{' '}
            <span className="font-mono font-medium text-gray-600">{review.proposal_id}</span>
          </p>
        )}
      </div>
    </div>
  );
}
