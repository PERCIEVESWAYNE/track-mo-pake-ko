export type Expense = {
  id: string;
  amount: number;
  date: string;
  category: string;
  note: string;
};

export type ExpenseInput = Omit<Expense, "id">;

export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: string;
};

export type BudgetInput = Omit<Budget, "id" | "spent">;