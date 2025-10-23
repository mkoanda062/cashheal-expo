// src/engine/financeEngine.ts

export type CalcInput = {
  monthlyIncome: number;
  rent: number;
  dailySpending: number;
  savingsPercentage: number;
};

export type CalcOutput = {
  monthlyBudget: number;
  rent: number;
  fixedCharges: number;
  savingsAmount: number;
  availableForSpending: number;
  dailyBudget: number;
  weeklyBudget: number;
  biweeklyBudget: number;
  monthlySpending: number;
  dailySpending: number;
  biweeklySpending: number;
  weeklySpending: number;
};

export async function computeFinance(input: CalcInput): Promise<CalcOutput> {
  const { monthlyIncome, rent, dailySpending, savingsPercentage } = input;
  
  // Calculs basés sur la logique de l'application
  const fixedCharges = rent + (monthlyIncome * 0.1); // 10% pour charges fixes
  const savingsAmount = monthlyIncome * (savingsPercentage / 100);
  const availableForSpending = Math.max(0, monthlyIncome - fixedCharges - savingsAmount);
  
  return {
    monthlyBudget: monthlyIncome,
    rent,
    fixedCharges,
    savingsAmount,
    availableForSpending,
    dailyBudget: availableForSpending / 30,
    weeklyBudget: availableForSpending / 4,
    biweeklyBudget: availableForSpending / 2,
    monthlySpending: availableForSpending,
    dailySpending,
    biweeklySpending: dailySpending * 14,
    weeklySpending: dailySpending * 7,
  };
}
