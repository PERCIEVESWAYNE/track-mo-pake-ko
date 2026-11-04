
import type { Expense, Budget } from "../../types";
import SummaryCard from "../../components/common/SummaryCard";
import RecentTransactions from "../../components/user/RecentTransactions";

import {
  ReceiptText,
  Plus,
  TrendingDown,
  PiggyBank,
  Tags,
} from "lucide-react";

type DashboardProps = {
  expenses: Expense[];
  budgets: Budget[];
  onAddBudget: () => void;
  onViewAll: () => void;
};

function Dashboard({
  expenses,
  budgets,
  onAddBudget,
  onViewAll,
}: DashboardProps) {
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const categoryCount = new Set(
    expenses.map((expense) => expense.category)
  ).size;

  const totalBudgetRemaining = budgets.reduce(
    (total, budget) => total + (budget.amount - budget.spent),
    0
  );

  const formattedTotal = totalExpenses.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

  const formattedBudgetRemaining = totalBudgetRemaining.toLocaleString(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's an overview of your expenses and budgets.
          </p>
        </div>

        <button
          onClick={onAddBudget}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg"
        >
          <Plus size={18} />
          Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Expenses"
          amount={formattedTotal}
          icon={<TrendingDown size={20} />}
          description="Total recorded expenses"
        />

        <SummaryCard
          title="Budget Remaining"
          amount={formattedBudgetRemaining}
          icon={<PiggyBank size={20} />}
          description={
            budgets.length > 0
              ? "Remaining from your set budgets"
              : "No budget set yet"
          }
        />

        <SummaryCard
          title="Tracked Categories"
          amount={String(categoryCount)}
          icon={<Tags size={20} />}
          description="Categories with expenses"
        />

        <SummaryCard
          title="Expense Entries"
          amount={String(expenses.length)}
          icon={<ReceiptText size={20} />}
          description="Number of recorded expenses"
        />
      </div>

      <RecentTransactions
        expenses={expenses}
        onViewAll={onViewAll}
      />
    </div>
  );
}

export default Dashboard;
