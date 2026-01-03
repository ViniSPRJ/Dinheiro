export type Transaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  hasNote?: boolean;
};

export type Budget = {
  id: string;
  name: string;
  spent: number;
  limit: number;
  rollover?: number;
};

export type CashFlow = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type Metric = {
  title: string;
  value: string;
  subtitle: string;
  trend: "up" | "down" | "neutral";
};

// Mock Data
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", description: "Uber* Trip", category: "Transporte", amount: -24.90, date: "Hoje" },
  { id: "2", description: "Spotify Premium", category: "Assinaturas", amount: -21.90, date: "Ontem", hasNote: true },
  { id: "3", description: "Pagamento Salário", category: "Renda", amount: 12500.00, date: "02 Jan" },
  { id: "4", description: "Supermercado Pão de Açúcar", category: "Alimentação", amount: -432.15, date: "01 Jan" },
  { id: "5", description: "Starbucks Coffee", category: "Alimentação", amount: -34.50, date: "01 Jan" },
];

const MOCK_BUDGETS: Budget[] = [
  { id: "1", name: "Alimentação", spent: 1450, limit: 2000, rollover: 120 },
  { id: "2", name: "Transporte", spent: 450, limit: 600 },
  { id: "3", name: "Lazer", spent: 890, limit: 800, rollover: -50 },
  { id: "4", name: "Assinaturas", spent: 240, limit: 300 },
];

const MOCK_CASH_FLOW: CashFlow[] = [
  { month: "Set", income: 12000, expenses: 8000, net: 4000 },
  { month: "Out", income: 12500, expenses: 9200, net: 3300 },
  { month: "Nov", income: 14000, expenses: 7500, net: 6500 },
  { month: "Dez", income: 22000, expenses: 15000, net: 7000 },
  { month: "Jan", income: 12500, expenses: 8430, net: 4070 },
];

const MOCK_METRICS: Metric[] = [
  { title: "Saldo Atual", value: "R$ 124.592,00", subtitle: "+2.4% este mês", trend: "up" },
  { title: "Gasto Mensal", value: "R$ 8.430,00", subtitle: "65% do orçamento", trend: "neutral" },
  { title: "Investimentos", value: "R$ 345.200,00", subtitle: "R$ 4.2k rendimentos", trend: "up" },
  { title: "Cartão de Crédito", value: "R$ 3.840,00", subtitle: "Vence em 5 dias", trend: "down" },
];

// Service Layer
export const api = {
  getTransactions: async (): Promise<Transaction[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_TRANSACTIONS;
  },
  
  getBudgets: async (): Promise<Budget[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_BUDGETS;
  },
  
  getCashFlow: async (): Promise<CashFlow[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return MOCK_CASH_FLOW;
  },

  getMetrics: async (): Promise<Metric[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_METRICS;
  },
  
  getPeriod: async (period: string) => {
     console.log(`Fetching data for period: ${period}`);
     // In a real app, this would filter data by period
     return {
         transactions: MOCK_TRANSACTIONS,
         budgets: MOCK_BUDGETS,
         cashFlow: MOCK_CASH_FLOW,
         metrics: MOCK_METRICS
     };
  }
};
