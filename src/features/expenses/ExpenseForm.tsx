import { useState } from "react";
import type { FormEvent } from "react";
import { X, AlertTriangle, Wallet } from "lucide-react";
import type { Expense, ExpenseInput, Budget } from "../../types";

function getLocalDate() {
  const today = new Date();

  return (
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0")
  );
}

function isCurrentMonth(date: string) {
  return date.slice(0, 7) === getLocalDate().slice(0, 7);
}

type ExpenseFormProps = {
  onCancel: () => void;
  onSave: (expense: ExpenseInput) => Promise<void>;
  expense?: Expense | null;
  budgets: Budget[];
  categories: string[];
};

function ExpenseForm({
  onCancel,
  onSave,
  expense,
  budgets,
  categories,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : ""
  );
  const [date, setDate] = useState(expense?.date || getLocalDate());
  const [category, setCategory] = useState(expense?.category || "");
  const [note, setNote] = useState(expense?.note || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAllowanceConfirmation, setShowAllowanceConfirmation] =
    useState(false);

  const allowance = budgets.find(
    (budget) => budget.category === "Overall Allowance"
  );

  const numericAmount = Number(amount);

  let currentSpent = allowance?.spent ?? 0;

  if (expense && isCurrentMonth(expense.date)) {
    currentSpent = Math.max(0, currentSpent - expense.amount);
  }

  const remainingAllowance = allowance
    ? allowance.amount - currentSpent
    : 0;

  const appliesToCurrentMonth = isCurrentMonth(date);

  const exceedsAllowance =
    Boolean(allowance) &&
    appliesToCurrentMonth &&
    numericAmount > Math.max(0, remainingAllowance);

  async function saveExpense() {
    setError("");
    setIsSaving(true);

    try {
      await onSave({
        amount: numericAmount,
        date,
        category,
        note: note.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save expense. Please try again."
      );
    } finally {
      setIsSaving(false);
      setShowAllowanceConfirmation(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!/^[0-9]+$/.test(amount)) {
      setError("Amount must contain whole numbers only.");
      return;
    }

    if (numericAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (numericAmount > 9999999) {
      setError("The maximum amount is ₱9,999,999.");
      return;
    }

    const selectedDate = new Date(date + "T00:00:00");
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (!date || selectedDate > currentDate) {
      setError("Future dates are not allowed.");
      return;
    }

    if (!category || !categories.includes(category)) {
      setError("Please select a valid expense category.");
      return;
    }

    if (note.length > 200) {
      setError("Note must not exceed 200 characters.");
      return;
    }

    if (!allowance) {
      await saveExpense();
      return;
    }

    if (exceedsAllowance) {
      setShowAllowanceConfirmation(true);
      return;
    }

    await saveExpense();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {expense ? "Edit Expense" : "Add Expense"}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {expense
              ? "Update your expense information."
              : "Enter the details of your expense."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
          aria-label="Close form"
        >
          <X size={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!allowance && (
          <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <Wallet size={20} className="shrink-0" />
            <p>
              No monthly allowance has been set. You can still record
              your expenses. You can create an allowance anytime from
              the Budgets page.
            </p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Amount (₱)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={7}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9]/g, ""));
              setError("");
              setShowAllowanceConfirmation(false);
            }}
            placeholder="Enter whole amount"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-gray-400">
            Enter whole numbers only.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={date}
            max={getLocalDate()}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
              setShowAllowanceConfirmation(false);
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setError("");
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSaving}
          >
            <option value="">Select a category</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {allowance && appliesToCurrentMonth && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-gray-700">
              <Wallet size={18} />
              Monthly allowance
            </div>

            <div className="mt-2 flex justify-between gap-2">
              <span className="text-gray-500">
                Remaining before this expense
              </span>
              <span className="font-semibold text-gray-800">
                ₱{Math.max(0, remainingAllowance).toLocaleString("en-PH")}
              </span>
            </div>

            {exceedsAllowance && (
              <div
                role="alert"
                className="mt-3 flex gap-2 text-amber-700"
              >
                <AlertTriangle size={18} className="shrink-0" />
                <p>
                  This expense exceeds your remaining allowance by ₱
                  {(
                    numericAmount - Math.max(0, remainingAllowance)
                  ).toLocaleString("en-PH")}.
                  You can still record this expense.
                </p>
              </div>
            )}

            {!exceedsAllowance && numericAmount > 0 && (
              <p className="mt-3 text-sm text-green-700">
                Remaining after this expense: ₱
                {Math.max(
                  0,
                  remainingAllowance - numericAmount
                ).toLocaleString("en-PH")}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Note <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a short description..."
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSaving}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {note.length}/200 characters
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {showAllowanceConfirmation && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                size={21}
                className="shrink-0 text-amber-600"
              />

              <div>
                <p className="font-semibold text-amber-900">
                  Expense exceeds your monthly allowance
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  This expense is ₱
                  {(
                    numericAmount - Math.max(0, remainingAllowance)
                  ).toLocaleString("en-PH")}{" "}
                  above your remaining allowance. Do you still want to
                  record it?
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAllowanceConfirmation(false)}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={saveExpense}
                disabled={isSaving}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Record Anyway"}
              </button>
            </div>
          </div>
        )}

        {!showAllowanceConfirmation && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || categories.length === 0}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : expense
                  ? "Update Expense"
                  : "Save Expense"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default ExpenseForm;