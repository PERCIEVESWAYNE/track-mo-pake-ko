
import type { Expense } from "../../types";

type RecentTransactionsProps = {
  expenses: Expense[];
  onViewAll: () => void;
};

function RecentTransactions({
  expenses,
  onViewAll,
}: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-bold text-gray-800">
            Recent Transactions
          </h2>
          <p className="text-sm text-gray-400">
            Your latest recorded expenses
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="text-sm text-green-700 font-medium hover:underline"
        >
          View all
        </button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          No expenses recorded yet.
        </p>
      ) : (
        <div className="space-y-4">
          {expenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {expense.category}
                </p>
                <p className="text-xs text-gray-400">
                  {expense.date}
                  {expense.note ? ` • ${expense.note}` : ""}
                </p>
              </div>

              <p className="font-semibold text-gray-800">
                ₱{expense.amount.toLocaleString("en-PH")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentTransactions;
