import type { Expense, ExpenseInput, Budget } from "../../types";
import type { NotificationPreferences } from "../../types/notifications";
import ExpenseForm from "../../features/expenses/ExpenseForm";
import ExpenseList from "../../features/expenses/ExpenseList";
import { Plus, AlertTriangle, Wallet, Tags } from "lucide-react";

type ExpensesProps = {
  expenses: Expense[];
  budgets: Budget[];
  categories: string[];
  filteredExpenses: Expense[];
  paginatedExpenses: Expense[];
  showExpenseForm: boolean;
  editingExpense: Expense | null;
  selectedCategory: string;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  notificationPreferences: NotificationPreferences;
  onAddExpense: () => void;
  onGoToBudgets: () => void;
  onManageCategories: () => void;
  onCancelExpenseForm: () => void;
  onSaveExpense: (expense: ExpenseInput) => Promise<void>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (expense: Expense) => void;
  onArchive: (id: string) => void;
};

function Expenses({
  expenses,
  budgets,
  categories,
  filteredExpenses,
  paginatedExpenses,
  showExpenseForm,
  editingExpense,
  selectedCategory,
  searchTerm,
  currentPage,
  totalPages,
  startIndex,
  itemsPerPage,
  notificationPreferences,
  onAddExpense,
  onManageCategories,
  onCancelExpenseForm,
  onSaveExpense,
  onSearchChange,
  onCategoryChange,
  onPageChange,
  onEdit,
  onArchive,
}: ExpensesProps) {
  const allowance = budgets.find(
    (budget) => budget.category === "Overall Allowance"
  );

  const spent = allowance?.spent ?? 0;
  const allowanceAmount = allowance?.amount ?? 0;
  const remaining = allowanceAmount - spent;

  const percentageUsed =
    allowanceAmount > 0 ? (spent / allowanceAmount) * 100 : 0;

  const hasAllowance = Boolean(allowance);

  const inAppNotificationsEnabled =
    notificationPreferences.in_app_notifications_enabled === true;

  const show80Warning =
    inAppNotificationsEnabled &&
    notificationPreferences.in_app_threshold_80_enabled === true &&
    percentageUsed >= 80 &&
    percentageUsed < 100;

  const show100Warning =
    inAppNotificationsEnabled &&
    notificationPreferences.in_app_threshold_100_enabled === true &&
    percentageUsed >= 100;

  const showAllowanceCard =
    hasAllowance && inAppNotificationsEnabled;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Expenses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Keep track of your spending and monitor your monthly allowance.
          </p>
        </div>

        {!showExpenseForm && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onManageCategories}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50"
            >
              <Tags size={18} />
              Manage Categories
            </button>

            <button
              onClick={onAddExpense}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white hover:bg-green-700"
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        )}
      </div>

      {showAllowanceCard && (
        <div
          className={`rounded-xl border p-4 ${
            show100Warning
              ? "border-red-200 bg-red-50"
              : show80Warning
                ? "border-amber-200 bg-amber-50"
                : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            {show100Warning || show80Warning ? (
              <AlertTriangle
                size={22}
                className={`mt-0.5 shrink-0 ${
                  show100Warning ? "text-red-600" : "text-amber-600"
                }`}
              />
            ) : (
              <Wallet
                size={22}
                className="mt-0.5 shrink-0 text-green-600"
              />
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`font-semibold ${
                  show100Warning
                    ? "text-red-800"
                    : show80Warning
                      ? "text-amber-800"
                      : "text-gray-800"
                }`}
              >
                {show100Warning
                  ? "Monthly allowance fully used"
                  : show80Warning
                    ? "You're getting close to your allowance!"
                    : "Monthly allowance status"}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {show100Warning
                  ? "You have reached your monthly allowance. You can still record new expenses."
                  : show80Warning
                    ? "You have used at least 80% of your monthly allowance. Monitor your remaining spending."
                    : percentageUsed >= 100
                      ? "Your monthly allowance has been fully used."
                      : percentageUsed >= 80
                        ? "You are approaching your monthly allowance."
                        : "Your spending is currently within your monthly allowance."}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Allowance: </span>
                  <span className="font-semibold text-gray-800">
                    ₱{allowanceAmount.toLocaleString("en-PH")}
                  </span>
                </p>

                <p>
                  <span className="text-gray-500">Spent: </span>
                  <span className="font-semibold text-gray-800">
                    ₱{spent.toLocaleString("en-PH")}
                  </span>
                </p>

                <p>
                  <span className="text-gray-500">Remaining: </span>
                  <span
                    className={`font-semibold ${
                      remaining <= 0 ? "text-red-700" : "text-gray-800"
                    }`}
                  >
                    ₱{Math.max(0, remaining).toLocaleString("en-PH")}
                  </span>
                </p>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentageUsed >= 100
                      ? "bg-red-500"
                      : percentageUsed >= 80
                        ? "bg-amber-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, percentageUsed))}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-right text-xs text-gray-500">
                {percentageUsed.toFixed(1)}% used
              </p>
            </div>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <ExpenseForm
          key={editingExpense?.id ?? "new-expense"}
          expense={editingExpense}
          budgets={budgets}
          categories={categories}
          onCancel={onCancelExpenseForm}
          onSave={onSaveExpense}
        />
      )}

      {!showExpenseForm && (
        <ExpenseList
          expenses={expenses}
          filteredExpenses={filteredExpenses}
          paginatedExpenses={paginatedExpenses}
          categories={categories}
          selectedCategory={selectedCategory}
          searchTerm={searchTerm}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          onSearchChange={onSearchChange}
          onCategoryChange={onCategoryChange}
          onPageChange={onPageChange}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      )}
    </div>
  );
}

export default Expenses;