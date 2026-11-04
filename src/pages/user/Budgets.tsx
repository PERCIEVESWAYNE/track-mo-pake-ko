
import { useState } from "react";
import type { FormEvent } from "react";
import type { Budget, BudgetInput } from "../../types";
import type { NotificationPreferences } from "../../types/notifications";

import NotificationSettings from "./NotificationSettings";

import {
  Plus,
  PiggyBank,
  TrendingDown,
  Wallet,
  Pencil,
  Trash2,
  AlertTriangle,
  Bell,
  MoreVertical,
} from "lucide-react";

type BudgetsProps = {
  budgets: Budget[];
  onAddBudget: (budget: BudgetInput) => Promise<void>;
  onUpdateBudget: (budget: Budget) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;

  notificationPreferences: NotificationPreferences;
  onUpdateNotificationPreferences: (
    updates: Partial<NotificationPreferences>
  ) => Promise<void>;
  notificationPreferencesLoading: boolean;
};

function Budgets({
  budgets,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  notificationPreferences,
  onUpdateNotificationPreferences,
  notificationPreferencesLoading,
}: BudgetsProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Menus and notification settings
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showBudgetMenu, setShowBudgetMenu] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);

  const allowance = budgets[0] ?? null;
  const [editingAllowance, setEditingAllowance] = useState(false);

  const spent = allowance?.spent ?? 0;
  const total = allowance?.amount ?? 0;
  const remaining = total - spent;

  const percentage = total > 0 ? (spent / total) * 100 : 0;
  const progress = Math.min(percentage, 100);

  function formatCurrency(value: number) {
    return value.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    });
  }

  function openAddForm() {
    setAmount("");
    setFormError("");
    setEditingAllowance(false);
    setShowForm(true);
  }

  function openEditForm() {
    if (!allowance) return;

    setAmount(String(allowance.amount));
    setFormError("");
    setEditingAllowance(true);
    setShowForm(true);
    setShowBudgetMenu(false);
  }

  async function saveAllowance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const numericAmount = Number(amount);

    if (
      !amount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setFormError("Please enter a valid monthly allowance.");
      return;
    }

    setSaving(true);

    try {
      if (editingAllowance && allowance) {
        await onUpdateBudget({
          ...allowance,
          category: "Overall Allowance",
          amount: numericAmount,
          period: "monthly",
        });
      } else {
        await onAddBudget({
          category: "Overall Allowance",
          amount: numericAmount,
          period: "monthly",
        });
      }

      setShowForm(false);
      setEditingAllowance(false);
      setAmount("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save your allowance. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAllowance() {
    if (!allowance) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your monthly allowance? You will not be able to record expenses until you set a new allowance."
    );

    if (!confirmed) return;

    try {
      await onDeleteBudget(allowance.id);
      setShowBudgetMenu(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete your allowance."
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Monthly Allowance
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your available money and monitor your spending.
          </p>
        </div>

        {!showForm && !allowance && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white hover:bg-green-700"
          >
            <Plus size={18} />
            Set Allowance
          </button>
        )}
      </div>

      {/* Allowance Period */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p className="text-sm text-gray-500">Allowance Period</p>

          <h2 className="font-semibold text-gray-800">
            {new Date().toLocaleDateString("en-PH", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        <span className="text-sm text-gray-500">Monthly</span>
      </div>

      {/* Budget Notifications */}
      <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-50 p-2.5 text-green-700">
              <Bell size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Budget Notifications
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose when and how you want to receive allowance alerts.
                These settings are also available in Settings.
              </p>
            </div>
          </div>

          {/* Notification three-dot menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setShowNotificationMenu((previous) => !previous)
              }
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Budget notification menu"
              aria-expanded={showNotificationMenu}
            >
              <MoreVertical size={20} />
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationSettings((previous) => !previous);
                    setShowNotificationMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {showNotificationSettings
                    ? "Hide Notification Settings"
                    : "Show Notification Settings"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hidden by default */}
        {showNotificationSettings && (
          <NotificationSettings
            preferences={notificationPreferences}
            onUpdate={onUpdateNotificationPreferences}
            loading={notificationPreferencesLoading}
          />
        )}

        {notificationPreferencesLoading && showNotificationSettings && (
          <p className="text-xs text-gray-500">
            Loading your notification preferences...
          </p>
        )}
      </section>

      {/* Allowance Form */}
      {showForm && (
        <form
          onSubmit={saveAllowance}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {editingAllowance
                ? "Update Monthly Allowance"
                : "Set Monthly Allowance"}
            </h2>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingAllowance(false);
              }}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Close allowance form"
              disabled={saving}
            >
              ✕
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Monthly Allowance Amount (₱)
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter your total monthly allowance"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={saving}
            />

            <p className="mt-2 text-xs text-gray-400">
              Enter the total amount of money available for this month.
            </p>
          </div>

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingAllowance(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Allowance"}
            </button>
          </div>
        </form>
      )}

      {allowance ? (
        <>
          {/* Allowance Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-3 text-green-600">
                  <Wallet size={21} />
                </div>

                <p className="text-sm text-gray-500">
                  Monthly Allowance
                </p>
              </div>

              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-3 text-red-600">
                  <TrendingDown size={21} />
                </div>

                <p className="text-sm text-gray-500">Total Spent</p>
              </div>

              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(spent)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <PiggyBank size={21} />
                </div>

                <p className="text-sm text-gray-500">
                  Remaining Allowance
                </p>
              </div>

              <p
                className={`text-2xl font-bold ${
                  remaining < 0 ? "text-red-600" : "text-gray-800"
                }`}
              >
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          {/* Allowance Usage */}
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                Allowance Usage
              </h2>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">
                  {percentage.toFixed(1)}%
                </span>

                {/* Allowance three-dot menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowBudgetMenu((previous) => !previous)
                    }
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    aria-label="Allowance menu"
                    aria-expanded={showBudgetMenu}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {showBudgetMenu && (
                    <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={openEditForm}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={16} />
                        Edit Allowance
                      </button>

                      <button
                        type="button"
                        onClick={deleteAllowance}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Delete Allowance
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage >= 100
                    ? "bg-red-500"
                    : percentage >= 80
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatCurrency(spent)} spent</span>
              <span>{formatCurrency(total)} total</span>
            </div>

            {percentage >= 80 && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  percentage >= 100
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                <AlertTriangle size={17} />

                {percentage >= 100
                  ? "Your monthly allowance has been fully used."
                  : "You have used at least 80% of your monthly allowance."}
              </div>
            )}
          </div>
        </>
      ) : (
        !showForm && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-green-50 p-4 text-green-600">
              <PiggyBank size={30} />
            </div>

            <h2 className="font-semibold text-gray-800">
              No Monthly Allowance Set
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Set your monthly allowance first. Once it is saved, you can
              start recording expenses and tracking your remaining balance.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white hover:bg-green-700"
            >
              <Plus size={18} />
              Set My Allowance
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default Budgets;
