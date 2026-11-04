import type { Expense } from "../../types";
import {
  ArchiveRestore,
  Trash2,
  ReceiptText,
} from "lucide-react";

type ArchiveProps = {
  expenses: Expense[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
};

function Archive({
  expenses,
  onRestore,
  onDelete,
}: ArchiveProps) {
  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this expense? This action cannot be undone."
    );

    if (confirmed) {
      onDelete(id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Archived Expenses
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, restore, or permanently delete your archived expenses.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <ReceiptText
              size={42}
              className="mx-auto text-gray-300 mb-3"
            />
            <h3 className="text-lg font-semibold text-gray-700">
              No archived expenses
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Expenses you archive will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Note</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {expense.date}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-800">
                      {expense.category}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {expense.note || "—"}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">
                      ₱{expense.amount.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => onRestore(expense.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100"
                          title="Restore expense"
                        >
                          <ArchiveRestore size={16} />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Permanently delete expense"
                          aria-label="Permanently delete expense"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {expenses.length} archived{" "}
        {expenses.length === 1 ? "expense" : "expenses"}
      </p>
    </div>
  );
}

export default Archive;