
import { useMemo, useState } from "react";
import type { Expense } from "../../types";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  CalendarDays,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ReportsProps = {
  expenses: Expense[];
};

type ReportPeriod = "today" | "week" | "month" | "year";

const ITEMS_PER_PAGE = 10;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Reports({ expenses }: ReportsProps) {
  const today = new Date();

  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedYear, setSelectedYear] = useState(
    String(today.getFullYear())
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [exportMessage, setExportMessage] = useState("");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(amount);

  const reportRange = useMemo(() => {
    const now = new Date();

    if (period === "today") {
      const date = formatDate(now);
      return { start: date, end: date, label: "Today" };
    }

    if (period === "week") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const difference = day === 0 ? -6 : 1 - day;

      startOfWeek.setDate(startOfWeek.getDate() + difference);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        start: formatDate(startOfWeek),
        end: formatDate(endOfWeek),
        label: "This Week",
      };
    }

    if (period === "month") {
      const [year, month] = selectedMonth.split("-").map(Number);
      const start = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();

      return {
        start,
        end: `${selectedMonth}-${String(lastDay).padStart(2, "0")}`,
        label: new Date(year, month - 1, 1).toLocaleDateString("en-PH", {
          month: "long",
          year: "numeric",
        }),
      };
    }

    return {
      start: `${selectedYear}-01-01`,
      end: `${selectedYear}-12-31`,
      label: selectedYear,
    };
  }, [period, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(
        (expense) =>
          expense.date >= reportRange.start &&
          expense.date <= reportRange.end
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, reportRange]);

  const totalSpent = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const transactionCount = filteredExpenses.length;

  const averageExpense =
    transactionCount > 0 ? totalSpent / transactionCount : 0;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    filteredExpenses.forEach((expense) => {
      totals[expense.category] =
        (totals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const highestCategory = categoryTotals[0];

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE)
  );

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function handlePeriodChange(newPeriod: ReportPeriod) {
    setPeriod(newPeriod);
    setCurrentPage(1);
    setExportMessage("");
  }

  function escapeCSV(value: string | number) {
    const text = String(value);
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;

    return `"${safeText.replace(/"/g, '""')}"`;
  }

  function exportCSV() {
    setExportMessage("");

    if (filteredExpenses.length === 0) {
      setExportMessage("There are no expenses to export for this period.");
      return;
    }

    const headers = ["Date", "Category", "Note", "Amount (PHP)"];

    const rows = filteredExpenses.map((expense) => [
      escapeCSV(expense.date),
      escapeCSV(expense.category),
      escapeCSV(expense.note || ""),
      expense.amount.toFixed(2),
    ]);

    const summary = [
      [],
      ["Report Summary"],
      ["Period", escapeCSV(reportRange.label)],
      ["Total Expenses (PHP)", totalSpent.toFixed(2)],
      ["Transaction Count", transactionCount],
      ["Average Expense (PHP)", averageExpense.toFixed(2)],
      [
        "Top Spending Category",
        escapeCSV(highestCategory ? highestCategory[0] : "No data"),
      ],
    ];

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.join(",")),
      ...summary.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Track-Mo-Report-${period}-${reportRange.start}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setExportMessage("Your CSV report has been downloaded.");
  }

  const periodButtonClass = (selected: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      selected
        ? "bg-green-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your spending and understand where your money goes.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={filteredExpenses.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {exportMessage && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {exportMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <Wallet size={20} className="text-blue-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-800">
            {formatCurrency(totalSpent)}
          </h2>
          <p className="mt-2 text-xs text-gray-400">
            For {reportRange.label}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Transactions</p>
            <Receipt size={20} className="text-purple-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-800">
            {transactionCount}
          </h2>
          <p className="mt-2 text-xs text-gray-400">Recorded expenses</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Average Expense</p>
            <TrendingDown size={20} className="text-orange-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-800">
            {formatCurrency(averageExpense)}
          </h2>
          <p className="mt-2 text-xs text-gray-400">Per transaction</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Top Spending</p>
            <TrendingUp size={20} className="text-red-500" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-800">
            {highestCategory ? highestCategory[0] : "No data"}
          </h2>
          <p className="mt-2 text-xs text-gray-400">
            {highestCategory
              ? formatCurrency(highestCategory[1])
              : "No recorded expenses"}
          </p>
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Expenses by Category
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Breakdown of your spending for {reportRange.label}.
        </p>

        {categoryTotals.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt size={36} className="mx-auto text-gray-300" />
            <p className="mt-3 text-gray-500">
              No expenses recorded for this period.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {categoryTotals.map(([category, amount]) => {
              const percentage =
                totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

              return (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {category}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(amount)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Records */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Expense Records
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View your recorded expenses by selected period.
          </p>
        </div>

        {/* Report Period Filters */}
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <CalendarDays size={17} className="text-gray-500" />
              Report Period
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePeriodChange("today")}
                className={periodButtonClass(period === "today")}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange("week")}
                className={periodButtonClass(period === "week")}
              >
                This Week
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange("month")}
                className={periodButtonClass(period === "month")}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange("year")}
                className={periodButtonClass(period === "year")}
              >
                Yearly
              </button>
            </div>
          </div>

          {period === "month" && (
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="report-month"
                className="text-sm text-gray-600"
              >
                Select month:
              </label>
              <input
                id="report-month"
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  if (event.target.value) {
                    setSelectedMonth(event.target.value);
                    setCurrentPage(1);
                    setExportMessage("");
                  }
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          )}

          {period === "year" && (
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="report-year"
                className="text-sm text-gray-600"
              >
                Select year:
              </label>
              <select
                id="report-year"
                value={selectedYear}
                onChange={(event) => {
                  setSelectedYear(event.target.value);
                  setCurrentPage(1);
                  setExportMessage("");
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                {Array.from(
                  { length: 10 },
                  (_, index) => today.getFullYear() - index
                ).map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Expense Table */}
        {filteredExpenses.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No transactions to display for {reportRange.label.toLowerCase()}.
          </p>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Note</th>
                    <th className="py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="whitespace-nowrap py-3 pr-4 text-gray-600">
                        {expense.date}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {expense.category}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {expense.note || "—"}
                      </td>
                      <td className="whitespace-nowrap py-3 text-right font-semibold text-gray-800">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredExpenses.length
                )}{" "}
                of {filteredExpenses.length} records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 border-t border-gray-100" />
      </div>
    </div>
  );
}

export default Reports;
