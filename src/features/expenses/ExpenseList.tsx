import type { Expense } from "../../types";
import {
  ReceiptText,
  Pencil,
  Archive,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ExpenseListProps = {
  expenses: Expense[];
  filteredExpenses: Expense[];
  paginatedExpenses: Expense[];
  categories: string[];
  selectedCategory: string;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (expense: Expense) => void;
  onArchive: (id: string) => void;
};

function ExpenseList({
  expenses,
  filteredExpenses,
  paginatedExpenses,
  categories,
  selectedCategory,
  searchTerm,
  currentPage,
  totalPages,
  startIndex,
  itemsPerPage,
  onSearchChange,
  onCategoryChange,
  onPageChange,
  onEdit,
  onArchive,
}: ExpenseListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 flex flex-wrap justify-between items-center gap-3 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-800">
            Expense Records
          </h2>
          <p className="text-sm text-gray-400">
            {filteredExpenses.length} transaction(s) found
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search expenses..."
              className="w-full sm:w-56 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="categoryFilter"
              className="text-sm text-gray-600"
            >
              Category:
            </label>

            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="All Categories">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16 px-4">
          <ReceiptText
            size={40}
            className="mx-auto text-gray-300 mb-3"
          />

          <h3 className="font-semibold text-gray-700">
            No expenses found
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            {expenses.length === 0
              ? "Start by adding your first expense."
              : "Try changing your search or category filter."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Note</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Amount
                  </th>
                  <th className="px-6 py-4 font-medium text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-t border-gray-100 text-sm"
                  >
                    <td className="px-6 py-4 text-gray-600">
                      {expense.date}
                    </td>

                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {expense.category}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {expense.note || "—"}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      ₱{expense.amount.toLocaleString("en-PH")}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Edit expense"
                          aria-label="Edit expense"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => onArchive(expense.id)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50"
                          title="Archive expense"
                          aria-label="Archive expense"
                        >
                          <Archive size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1}–
              {Math.min(
                startIndex + itemsPerPage,
                filteredExpenses.length
              )}{" "}
              of {filteredExpenses.length} transactions
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onPageChange(Math.max(1, currentPage - 1))
                }
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-sm text-gray-600 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ExpenseList;