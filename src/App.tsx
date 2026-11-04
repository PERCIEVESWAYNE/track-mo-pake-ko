
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  Expense,
  ExpenseInput,
  Budget,
  BudgetInput,
} from "./types";
import { supabase } from "./lib/supabase";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "./types/notifications";

import Auth from "./pages/auth/Auth";
import Sidebar from "./components/common/Sidebar";
import Dashboard from "./pages/user/Dashboard";
import Expenses from "./pages/user/Expenses";
import Budgets from "./pages/user/Budgets";
import Reports from "./pages/user/Reports";
import Archive from "./pages/user/Archive";
import FinancialLiteracy from "./pages/user/FinancialLiteracy";
import Settings from "./pages/user/Settings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserAccounts from "./pages/admin/UserAccounts";
import Categories from "./pages/admin/Categories";
import AuditLogs from "./pages/admin/AuditLogs";

import CategoryManager from "./features/categories/CategoryManager";
import type { UserCategory } from "./features/categories/CategoryManager";

import {
  LayoutDashboard,
  Users,
  Tags,
  FileClock,
  LogOut,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type ExpenseRow = {
  id: string;
  amount: number | string;
  category: string;
  note: string | null;
  expense_date: string;
  is_archived: boolean;
};

type BudgetRow = {
  id: string;
  category: string;
  amount: number | string;
  period: string;
};

type UserCategoryRow = {
  id: string;
  user_id: string;
  name: string;
};

const DEACTIVATED_MESSAGE =
  "Your account has been deactivated. Please contact the administrator for assistance.";

const AUTH_NOTICE_KEY = "track-mo-auth-notice";
const VERIFIED_NOTICE_KEY = "track-mo-email-verified";

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    date: row.expense_date,
    category: row.category,
    note: row.note ?? "",
  };
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function createAuditLog(
  userId: string,
  action: string,
  description: string
) {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      description,
    });

    if (error) {
      console.error("Unable to create audit log:", error);
    }
  } catch (error) {
    console.error("Audit logging failed:", error);
  }
}

// Check the user's monthly Overall Allowance thresholds.
async function checkBudgetAlerts() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-budget-alert",
      {
        body: {
          action: "check_budget",
        },
      }
    );

    if (error) {
      console.error("Unable to check budget alerts:", error);
      return;
    }

    console.log("Budget alert check result:", data);
  } catch (error) {
    console.error("Budget alert check failed:", error);
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [adminSidebarCollapsed, setAdminSidebarCollapsed] =
    useState(false);
  const [adminActivePage, setAdminActivePage] = useState("Dashboard");

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [archivedExpenses, setArchivedExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  // Personal expense categories.
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesSaving, setCategoriesSaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCategoryOnboarding, setShowCategoryOnboarding] =
    useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  // Shared notification preferences for Settings and Budgets.
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(
      DEFAULT_NOTIFICATION_PREFERENCES
    );

  const [notificationPreferencesLoading, setNotificationPreferencesLoading] =
    useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("track-mo-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("track-mo-theme", theme);

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Handle Supabase email verification and password recovery.
  useEffect(() => {
    let isMounted = true;
    let verificationRedirect = false;
    let cleanupSubscription: (() => void) | undefined;

    async function initializeAuthentication() {
      try {
        const url = new URL(window.location.href);

        const verificationRequested =
          url.searchParams.get("verified") === "1";

        const code = url.searchParams.get("code");

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        const recoveryRequested =
          hashParams.get("type") === "recovery" ||
          url.searchParams.get("type") === "recovery";

        if (recoveryRequested && isMounted) {
          setIsPasswordRecovery(true);
        }

        // Process an actual Supabase verification callback.
        if (
          verificationRequested &&
          (code || (accessToken && refreshToken))
        ) {
          verificationRedirect = true;

          let verificationSucceeded = false;

          if (code) {
            const { error } =
              await supabase.auth.exchangeCodeForSession(code);

            if (error) throw error;

            verificationSucceeded = true;
          } else if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;

            verificationSucceeded = true;
          }

          if (verificationSucceeded) {
            sessionStorage.setItem(
              VERIFIED_NOTICE_KEY,
              "Your email has been verified successfully. You can now sign in to your account."
            );

            // The user must manually sign in after verification.
            const { error: signOutError } =
              await supabase.auth.signOut();

            if (signOutError) {
              console.error(
                "Unable to clear the verification session:",
                signOutError
              );
            }
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          if (isMounted) {
            setSession(null);
            setUserRole(null);
            setRoleError("");
            setAuthLoading(false);
          }

          return;
        }

        if (verificationRequested) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, currentSession) => {
          if (!isMounted) return;

          if (event === "PASSWORD_RECOVERY") {
            setIsPasswordRecovery(true);
          }

          setSession((previousSession) => {
            const previousUserId = previousSession?.user.id ?? null;
            const currentUserId = currentSession?.user.id ?? null;

            if (previousUserId !== currentUserId) {
              setUserRole(null);
              setRoleError("");
              setUserCategories([]);
              setDefaultCategories([]);
              setShowCategoryOnboarding(false);
              setShowCategoryManager(false);
              setOnboardingCompleted(true);
            }

            return currentSession;
          });

          setAuthLoading(false);
        });

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted && !verificationRedirect) {
          setSession(data.session);
        }

        if (!isMounted) {
          subscription.unsubscribe();
        } else {
          cleanupSubscription = () => subscription.unsubscribe();
        }
      } catch (error) {
        console.error(
          "Unable to initialize authentication:",
          error
        );

        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    initializeAuthentication();

    return () => {
      isMounted = false;
      cleanupSubscription?.();
    };
  }, []);

  // Verify the user's role, account status, and onboarding status.
  useEffect(() => {
    let isActive = true;

    async function loadUserRole() {
      if (!session?.user.id || isPasswordRecovery) {
        setUserRole(null);
        setRoleError("");
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      setRoleError("");

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, is_active, onboarding_completed")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data.is_active !== true) {
          throw new Error(DEACTIVATED_MESSAGE);
        }

        const role = data?.role?.toLowerCase();

        if (role !== "admin" && role !== "user") {
          throw new Error(
            `Invalid account role: ${data?.role ?? "missing"}`
          );
        }

        if (isActive) {
          setUserRole(role);
          setRoleError("");

          if (role === "user") {
            const completed = data.onboarding_completed === true;

            setOnboardingCompleted(completed);
            setShowCategoryOnboarding(!completed);
          } else {
            setOnboardingCompleted(true);
            setShowCategoryOnboarding(false);
          }
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "object" &&
                error !== null &&
                "message" in error
              ? String(error.message)
              : "Unknown error while verifying your account.";

        const isDeactivated = message === DEACTIVATED_MESSAGE;

        if (!isDeactivated) {
          console.error("Unable to verify user account:", error);
        }

        if (isActive) {
          setUserRole(null);

          if (isDeactivated) {
            try {
              sessionStorage.setItem(
                AUTH_NOTICE_KEY,
                DEACTIVATED_MESSAGE
              );
            } catch (storageError) {
              console.error(
                "Unable to save account deactivation notice:",
                storageError
              );
            }

            setRoleError("");

            const { error: signOutError } =
              await supabase.auth.signOut();

            if (signOutError) {
              console.error(
                "Unable to sign out deactivated account:",
                signOutError
              );

              if (isActive) {
                setRoleError(DEACTIVATED_MESSAGE);
              }
            }
          } else {
            setRoleError(message);
          }
        }
      } finally {
        if (isActive) {
          setRoleLoading(false);
        }
      }
    }

    loadUserRole();

    return () => {
      isActive = false;
    };
  }, [session?.user.id, isPasswordRecovery]);

  // Load shared default categories and the current user's personal categories.
  useEffect(() => {
    let isActive = true;

    async function loadUserCategories() {
      if (
        !session?.user.id ||
        userRole !== "user" ||
        isPasswordRecovery
      ) {
        setUserCategories([]);
        setDefaultCategories([]);
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      setCategoryError("");

      try {
        // Load admin-managed shared categories as defaults.
        const { data: sharedData, error: sharedError } = await supabase
          .from("categories")
          .select("name")
          .order("name", { ascending: true });

        if (sharedError) throw sharedError;

        const sharedNames = (sharedData ?? [])
          .map((item) => item.name)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0
          );

        if (!isActive) return;

        setDefaultCategories(sharedNames);

        // Load this user's own categories.
        const { data: personalData, error: personalError } =
          await supabase
            .from("user_categories")
            .select("id, user_id, name")
            .eq("user_id", session.user.id)
            .order("name", { ascending: true });

        if (personalError) throw personalError;
        if (!isActive) return;

        let personalRows = (personalData ?? []) as UserCategoryRow[];

        // Existing users who have no personal categories should
        // automatically receive copies of the shared defaults.
        // This does not show the onboarding popup again.
        if (personalRows.length === 0 && onboardingCompleted) {
          if (sharedNames.length > 0) {
            const seedRows = sharedNames.map((name) => ({
              user_id: session.user.id,
              name,
            }));

            const { error: seedError } = await supabase
              .from("user_categories")
              .insert(seedRows);

            if (seedError) throw seedError;

            const { data: seededData, error: seededError } =
              await supabase
                .from("user_categories")
                .select("id, user_id, name")
                .eq("user_id", session.user.id)
                .order("name", { ascending: true });

            if (seededError) throw seededError;

            personalRows = (seededData ?? []) as UserCategoryRow[];
          }
        }

        if (!isActive) return;

        setUserCategories(
          personalRows.map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
      } catch (error) {
        console.error("Unable to load categories:", error);

        if (isActive) {
          setCategoryError(
            error instanceof Error
              ? error.message
              : "Unable to load your expense categories."
          );
        }
      } finally {
        if (isActive) {
          setCategoriesLoading(false);
        }
      }
    }

    loadUserCategories();

    return () => {
      isActive = false;
    };
  }, [
    session?.user.id,
    userRole,
    isPasswordRecovery,
    onboardingCompleted,
  ]);

  // Save the user's personal categories.
  async function saveUserCategories(
    updatedCategories: UserCategory[]
  ) {
    if (!session?.user.id || userRole !== "user") {
      throw new Error(
        "You must be signed in as a regular user to manage categories."
      );
    }

    setCategoriesSaving(true);
    setCategoryError("");

    try {
      const cleanedCategories = updatedCategories
        .map((category) => ({
          id: category.id,
          name: category.name.trim(),
        }))
        .filter((category) => category.name.length > 0);

      const uniqueNames = new Set(
        cleanedCategories.map((category) =>
          category.name.toLowerCase()
        )
      );

      if (uniqueNames.size !== cleanedCategories.length) {
        throw new Error("You cannot have duplicate category names.");
      }

      if (cleanedCategories.length === 0) {
        throw new Error(
          "Please keep at least one expense category."
        );
      }

      // Identify categories removed by the user.
      const removedCategories = userCategories.filter(
        (oldCategory) =>
          !cleanedCategories.some(
            (newCategory) => newCategory.id === oldCategory.id
          )
      );

      // Prevent removing categories that are already used by expenses.
      for (const removedCategory of removedCategories) {
        const { count, error } = await supabase
          .from("expenses")
          .select("id", { count: "exact", head: true })
          .eq("category", removedCategory.name);

        if (error) throw error;

        if ((count ?? 0) > 0) {
          throw new Error(
            `"${removedCategory.name}" is already used by one or more expenses. Rename it instead of removing it.`
          );
        }
      }

      // Update expense records when an existing category is renamed.
      for (const oldCategory of userCategories) {
        const matchingCategory = cleanedCategories.find(
          (newCategory) => newCategory.id === oldCategory.id
        );

        if (
          matchingCategory &&
          matchingCategory.name !== oldCategory.name
        ) {
          const { error } = await supabase
            .from("expenses")
            .update({
              category: matchingCategory.name,
              updated_at: new Date().toISOString(),
            })
            .eq("category", oldCategory.name);

          if (error) throw error;
        }
      }

      // Remove deleted categories from the user's personal category table.
      const removedIds = removedCategories
        .map((category) => category.id)
        .filter(
          (id) =>
            id &&
            !id.startsWith("new-") &&
            !id.startsWith("default-")
        );

      if (removedIds.length > 0) {
        const { error } = await supabase
          .from("user_categories")
          .delete()
          .eq("user_id", session.user.id)
          .in("id", removedIds);

        if (error) throw error;
      }

      // Identify categories that need to be inserted.
      const categoriesToInsert = cleanedCategories.filter(
        (category) =>
          category.id.startsWith("new-") ||
          category.id.startsWith("default-") ||
          !userCategories.some(
            (existing) => existing.id === category.id
          )
      );

      if (categoriesToInsert.length > 0) {
        const { error } = await supabase
          .from("user_categories")
          .insert(
            categoriesToInsert.map((category) => ({
              user_id: session.user.id,
              name: category.name,
            }))
          );

        if (error) throw error;
      }

      // Retrieve the saved categories with their actual database IDs.
      const { data: savedData, error: savedError } = await supabase
        .from("user_categories")
        .select("id, user_id, name")
        .eq("user_id", session.user.id)
        .order("name", { ascending: true });

      if (savedError) throw savedError;

      const savedCategories = (savedData ?? []) as UserCategoryRow[];

      if (savedCategories.length === 0) {
        throw new Error(
          "No categories were saved. Please try again."
        );
      }

      // Complete onboarding after the categories have been saved.
      if (!onboardingCompleted) {
        const { error } = await supabase
          .from("profiles")
          .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id);

        if (error) throw error;
      }

      setUserCategories(
        savedCategories.map((category) => ({
          id: category.id,
          name: category.name,
        }))
      );

      setOnboardingCompleted(true);
      setShowCategoryOnboarding(false);
      setShowCategoryManager(false);

      await createAuditLog(
        session.user.id,
        "UPDATE",
        "Updated personal expense categories."
      );
    } catch (error) {
      console.error("Unable to save personal categories:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your expense categories.";

      setCategoryError(message);
      throw new Error(message);
    } finally {
      setCategoriesSaving(false);
    }
  }

  // Load expenses from Supabase.
  // Only regular users can load their own financial records.
  useEffect(() => {
    let isActive = true;

    async function loadExpenses() {
      if (!session?.user.id || userRole !== "user" || isPasswordRecovery) {
        setExpenses([]);
        setArchivedExpenses([]);
        setExpensesLoading(false);
        return;
      }

      setExpensesLoading(true);
      setExpenseError("");

      try {
        const { data, error } = await supabase
          .from("expenses")
          .select("id, amount, category, note, expense_date, is_archived")
          .order("expense_date", { ascending: false });

        if (error) throw error;
        if (!isActive) return;

        const rows = (data ?? []) as ExpenseRow[];

        setExpenses(
          rows.filter((row) => !row.is_archived).map(mapExpense)
        );

        setArchivedExpenses(
          rows.filter((row) => row.is_archived).map(mapExpense)
        );
      } catch (error) {
        console.error("Unable to load expenses:", error);

        if (isActive) {
          setExpenseError(
            error instanceof Error
              ? error.message
              : "Unable to load your expenses."
          );
        }
      } finally {
        if (isActive) setExpensesLoading(false);
      }
    }

    loadExpenses();

    return () => {
      isActive = false;
    };
  }, [session?.user.id, userRole, isPasswordRecovery]);

  // Load the user's allowance from Supabase.
  useEffect(() => {
    let isActive = true;

    async function loadBudgets() {
      if (!session?.user.id || userRole !== "user" || isPasswordRecovery) {
        setBudgets([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("budgets")
          .select("id, category, amount, period")
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!isActive) return;

        const rows = (data ?? []) as BudgetRow[];

        setBudgets(
          rows.map((row) => ({
            id: row.id,
            category: row.category,
            amount: Number(row.amount),
            spent: 0,
            period: row.period,
          }))
        );
      } catch (error) {
        console.error("Unable to load budgets:", error);

        if (isActive) {
          setExpenseError(
            error instanceof Error
              ? error.message
              : "Unable to load your allowance."
          );
        }
      }
    }

    loadBudgets();

    return () => {
      isActive = false;
    };
  }, [session?.user.id, userRole, isPasswordRecovery]);

  // Load notification preferences from Supabase.
  useEffect(() => {
    let isActive = true;

    async function loadNotificationPreferences() {
      if (!session?.user.id || userRole !== "user" || isPasswordRecovery) {
        setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        setNotificationPreferencesLoading(false);
        return;
      }

      setNotificationPreferencesLoading(true);

      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select(
            "email_alerts_enabled, in_app_notifications_enabled, email_threshold_50_enabled, email_threshold_80_enabled, email_threshold_100_enabled, in_app_threshold_50_enabled, in_app_threshold_80_enabled, in_app_threshold_100_enabled"
          )
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (isActive) {
          setNotificationPreferences(
            data
              ? {
                  email_alerts_enabled:
                    data.email_alerts_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.email_alerts_enabled,
                  in_app_notifications_enabled:
                    data.in_app_notifications_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.in_app_notifications_enabled,
                  email_threshold_50_enabled:
                    data.email_threshold_50_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.email_threshold_50_enabled,
                  email_threshold_80_enabled:
                    data.email_threshold_80_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.email_threshold_80_enabled,
                  email_threshold_100_enabled:
                    data.email_threshold_100_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.email_threshold_100_enabled,
                  in_app_threshold_50_enabled:
                    data.in_app_threshold_50_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.in_app_threshold_50_enabled,
                  in_app_threshold_80_enabled:
                    data.in_app_threshold_80_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.in_app_threshold_80_enabled,
                  in_app_threshold_100_enabled:
                    data.in_app_threshold_100_enabled ??
                    DEFAULT_NOTIFICATION_PREFERENCES.in_app_threshold_100_enabled,
                }
              : DEFAULT_NOTIFICATION_PREFERENCES
          );
        }
      } catch (error) {
        console.error(
          "Unable to load notification preferences:",
          error
        );
      } finally {
        if (isActive) {
          setNotificationPreferencesLoading(false);
        }
      }
    }

    loadNotificationPreferences();

    return () => {
      isActive = false;
    };
  }, [session?.user.id, userRole, isPasswordRecovery]);

  // Save shared notification preferences to Supabase.
  async function updateNotificationPreferences(
    updates: Partial<NotificationPreferences>
  ) {
    if (!session?.user.id || userRole !== "user") {
      throw new Error(
        "You must be signed in as a regular user to update notification preferences."
      );
    }

    const previousPreferences = notificationPreferences;

    const updatedPreferences = {
      ...previousPreferences,
      ...updates,
    };

    setNotificationPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: session.user.id,
            ...updatedPreferences,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    } catch (error) {
      setNotificationPreferences(previousPreferences);
      throw error;
    }
  }

  const today = new Date();

  const monthStart = getLocalDateString(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const nextMonthStart = getLocalDateString(
    new Date(today.getFullYear(), today.getMonth() + 1, 1)
  );

  const monthlySpent = expenses
    .filter(
      (expense) =>
        expense.date >= monthStart && expense.date < nextMonthStart
    )
    .reduce((total, expense) => total + expense.amount, 0);

  const budgetsWithSpending = budgets
    .filter((budget) => budget.category === "Overall Allowance")
    .slice(0, 1)
    .map((budget) => ({
      ...budget,
      spent: monthlySpent,
    }));

  const monthlyAllowance = budgetsWithSpending[0] ?? null;

  const itemsPerPage = 5;

  const filteredExpenses = expenses.filter((expense) => {
    const matchesCategory =
      selectedCategory === "All Categories" ||
      expense.category === selectedCategory;

    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      expense.category.toLowerCase().includes(search) ||
      expense.note.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedExpenses = filteredExpenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Add or update an expense.
  async function saveExpense(expense: ExpenseInput) {
    setExpenseError("");

    try {
      if (!session?.user.id || userRole !== "user") {
        throw new Error("You must be signed in as a user to save an expense.");
      }

      if (
        monthlyAllowance &&
        expense.date >= monthStart &&
        expense.date < nextMonthStart
      ) {
        const spentWithoutEditedExpense = expenses
          .filter(
            (item) =>
              item.date >= monthStart &&
              item.date < nextMonthStart &&
              item.id !== editingExpense?.id
          )
          .reduce((total, item) => total + item.amount, 0);

        const available =
          monthlyAllowance.amount - spentWithoutEditedExpense;

        if (expense.amount > available) {
          console.warn(
            "Expense exceeds the remaining monthly allowance."
          );
        }
      }

      if (editingExpense) {
        const { data, error } = await supabase
          .from("expenses")
          .update({
            amount: expense.amount,
            category: expense.category,
            note: expense.note || null,
            expense_date: expense.date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingExpense.id)
          .select("id, amount, category, note, expense_date, is_archived")
          .single();

        if (error) throw error;

        const updatedExpense = mapExpense(data as ExpenseRow);

        setExpenses((previous) =>
          previous.map((item) =>
            item.id === updatedExpense.id ? updatedExpense : item
          )
        );

        await createAuditLog(
          session.user.id,
          "UPDATE",
          `Updated an expense: ${expense.category} - ₱${expense.amount.toLocaleString("en-PH")}`
        );
      } else {
        const { data, error } = await supabase
          .from("expenses")
          .insert({
            user_id: session.user.id,
            amount: expense.amount,
            category: expense.category,
            note: expense.note || null,
            expense_date: expense.date,
          })
          .select("id, amount, category, note, expense_date, is_archived")
          .single();

        if (error) throw error;

        const newExpense = mapExpense(data as ExpenseRow);

        setExpenses((previous) => [newExpense, ...previous]);

        await createAuditLog(
          session.user.id,
          "CREATE",
          `Added a new expense: ${expense.category} - ₱${expense.amount.toLocaleString("en-PH")}`
        );
      }

      await checkBudgetAlerts();

      setShowExpenseForm(false);
      setEditingExpense(null);
      setSelectedCategory("All Categories");
      setSearchTerm("");
      setCurrentPage(1);
    } catch (error) {
      console.error("Unable to save expense:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save expense. Please try again.";

      setExpenseError(message);
      throw new Error(message);
    }
  }

  function cancelExpenseForm() {
    setShowExpenseForm(false);
    setEditingExpense(null);
  }

  function openAddExpense() {
    setExpenseError("");
    setActivePage("Expenses");
    setEditingExpense(null);
    setShowExpenseForm(true);
  }

  function openEditExpense(expense: Expense) {
    setExpenseError("");
    setEditingExpense(expense);
    setShowExpenseForm(true);
  }

  function openCategoryManager() {
    setCategoryError("");
    setShowCategoryManager(true);
  }

  // Archive an expense.
  async function archiveExpense(id: string) {
    setExpenseError("");

    try {
      if (!session?.user.id || userRole !== "user") {
        throw new Error("You must be signed in as a user to archive an expense.");
      }

      const expenseToArchive = expenses.find(
        (expense) => expense.id === id
      );

      if (!expenseToArchive) return;

      const { error } = await supabase
        .from("expenses")
        .update({
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setArchivedExpenses((previous) => [
        expenseToArchive,
        ...previous,
      ]);

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );

      await createAuditLog(
        session.user.id,
        "ARCHIVE",
        `Archived an expense: ${expenseToArchive.category} - ₱${expenseToArchive.amount.toLocaleString("en-PH")}`
      );

      setCurrentPage(1);
    } catch (error) {
      console.error("Unable to archive expense:", error);

      setExpenseError(
        error instanceof Error
          ? error.message
          : "Unable to archive expense."
      );
    }
  }

  // Restore an archived expense.
  async function restoreExpense(id: string) {
    setExpenseError("");

    if (!session?.user.id || userRole !== "user") {
      setExpenseError("You must be signed in as a user to restore an expense.");
      return;
    }

    const expenseToRestore = archivedExpenses.find(
      (expense) => expense.id === id
    );

    if (!expenseToRestore) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          is_archived: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setExpenses((previous) => [
        expenseToRestore,
        ...previous,
      ]);

      setArchivedExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );

      await createAuditLog(
        session.user.id,
        "RESTORE",
        `Restored an expense: ${expenseToRestore.category} - ₱${expenseToRestore.amount.toLocaleString("en-PH")}`
      );
    } catch (error) {
      console.error("Unable to restore expense:", error);

      setExpenseError(
        error instanceof Error
          ? error.message
          : "Unable to restore expense."
      );
    }
  }

  // Permanently delete an archived expense.
  async function permanentlyDeleteExpense(id: string) {
    setExpenseError("");

    try {
      if (!session?.user.id || userRole !== "user") {
        throw new Error("You must be signed in as a user to delete an expense.");
      }

      const deletedExpense = archivedExpenses.find(
        (expense) => expense.id === id
      );

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setArchivedExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );

      if (deletedExpense) {
        await createAuditLog(
          session.user.id,
          "DELETE",
          `Permanently deleted an expense: ${deletedExpense.category} - ₱${deletedExpense.amount.toLocaleString("en-PH")}`
        );
      }
    } catch (error) {
      console.error("Unable to delete expense:", error);

      setExpenseError(
        error instanceof Error
          ? error.message
          : "Unable to permanently delete expense."
      );
    }
  }

  // Add a monthly allowance.
  async function addBudget(budget: BudgetInput) {
    setExpenseError("");

    try {
      if (!session?.user.id || userRole !== "user") {
        throw new Error("You must be signed in as a user to save an allowance.");
      }

      if (
        budgets.some(
          (item) => item.category === "Overall Allowance"
        )
      ) {
        throw new Error(
          "You already have a monthly allowance. Please edit the existing allowance."
        );
      }

      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: session.user.id,
          category: "Overall Allowance",
          amount: budget.amount,
          period: "monthly",
        })
        .select("id, category, amount, period")
        .single();

      if (error) throw error;

      const row = data as BudgetRow;

      setBudgets((previous) => [
        ...previous,
        {
          id: row.id,
          category: row.category,
          amount: Number(row.amount),
          spent: monthlySpent,
          period: row.period,
        },
      ]);
    } catch (error) {
      console.error("Unable to add allowance:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save allowance.";

      setExpenseError(message);
      throw new Error(message);
    }
  }

  // Update the monthly allowance.
  async function updateBudget(updatedBudget: Budget) {
    setExpenseError("");

    try {
      if (!session?.user.id || userRole !== "user") {
        throw new Error("You must be signed in as a user to update an allowance.");
      }

      const { data, error } = await supabase
        .from("budgets")
        .update({
          category: "Overall Allowance",
          amount: updatedBudget.amount,
          period: "monthly",
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedBudget.id)
        .select("id, category, amount, period")
        .single();

      if (error) throw error;

      const row = data as BudgetRow;

      setBudgets((previous) =>
        previous.map((budget) =>
          budget.id === row.id
            ? {
                id: row.id,
                category: row.category,
                amount: Number(row.amount),
                spent: monthlySpent,
                period: row.period,
              }
            : budget
        )
      );
    } catch (error) {
      console.error("Unable to update allowance:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update allowance.";

      setExpenseError(message);
      throw new Error(message);
    }
  }

  // Delete the monthly allowance.
  async function deleteBudget(id: string) {
    setExpenseError("");

    try {
      if (!session?.user.id || userRole !== "user") {
        throw new Error("You must be signed in as a user to delete an allowance.");
      }

      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setBudgets((previous) =>
        previous.filter((budget) => budget.id !== id)
      );
    } catch (error) {
      console.error("Unable to delete allowance:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete allowance.";

      setExpenseError(message);
      throw new Error(message);
    }
  }

  function changePage(page: string) {
    setActivePage(page);
    cancelExpenseForm();
    setExpenseError("");
  }

  function toggleSidebar() {
    setSidebarCollapsed((previous) => !previous);
  }

  async function handleSignOut() {
    setExpenseError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setExpenseError(error.message);
    }
  }

  // Authentication loading.
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Checking your account...
        </p>
      </div>
    );
  }

  // Show password recovery before normal role verification.
  if (isPasswordRecovery) {
    return (
      <Auth
        recoveryMode
        onRecoveryComplete={() => setIsPasswordRecovery(false)}
      />
    );
  }

  // No session means the user must log in.
  if (!session) {
    return <Auth />;
  }

  // Show role verification loading.
  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Verifying your account...
        </p>
      </div>
    );
  }

  // No valid role means no access to either dashboard.
  if (!userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Account Verification Failed
          </h2>

          <p className="mt-3 text-sm text-red-600">
            {roleError || "Your account role could not be verified."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Try Again
          </button>

          <button
            onClick={handleSignOut}
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Administrator dashboard with sidebar.
  if (userRole === "admin") {
    const adminNavigation = [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "User Management", icon: Users },
      { name: "Categories", icon: Tags },
      { name: "Audit Logs", icon: FileClock },
    ];

    return (
      <div className="flex min-h-screen bg-gray-50 text-gray-900">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 md:sticky md:top-0 md:h-screen ${
            adminSidebarCollapsed ? "w-[76px]" : "w-64"
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-gray-100 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <ShieldCheck size={23} />
              </div>

              {!adminSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold">
                    Track Mo, Pake ko!
                  </h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              )}
            </div>

            <button
              onClick={() =>
                setAdminSidebarCollapsed((previous) => !previous)
              }
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              title={
                adminSidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              {adminSidebarCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
            <p
              className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${
                adminSidebarCollapsed ? "text-center" : ""
              }`}
            >
              {adminSidebarCollapsed ? "•••" : "Main Menu"}
            </p>

            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = adminActivePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => setAdminActivePage(item.name)}
                  title={adminSidebarCollapsed ? item.name : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${
                    adminSidebarCollapsed
                      ? "justify-center"
                      : "text-left"
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  {!adminSidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-3">
            {!adminSidebarCollapsed && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <ShieldCheck size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Administrator
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {session.user.email}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              title={adminSidebarCollapsed ? "Sign Out" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 ${
                adminSidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <LogOut size={19} />
              {!adminSidebarCollapsed && "Sign Out"}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {adminActivePage}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor your Track Mo system.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Administrator
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {adminActivePage === "Dashboard" && <AdminDashboard />}
            {adminActivePage === "User Management" && <UserAccounts />}
            {adminActivePage === "Categories" && <Categories />}
            {adminActivePage === "Audit Logs" && <AuditLogs />}

            {adminActivePage !== "Dashboard" &&
              adminActivePage !== "User Management" &&
              adminActivePage !== "Categories" &&
              adminActivePage !== "Audit Logs" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">
                    {adminActivePage}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    This section will be connected to its management page
                    in the next development step.
                  </p>
                </div>
              )}
          </div>
        </main>
      </div>
    );
  }

  // Wait until expenses and personal categories are loaded.
  if (expensesLoading || categoriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading your Track Mo account...
        </p>
      </div>
    );
  }

  // For first-time users, use the shared categories as the initial
  // selections in the onboarding manager. These are only copied into
  // user_categories after the user saves.
  const onboardingCategories: UserCategory[] =
    showCategoryOnboarding && userCategories.length === 0
      ? defaultCategories.map((name) => ({
          id: `default-${name}`,
          name,
        }))
      : userCategories;

  // Regular user dashboard.
  return (
    <div
      className={`app-theme min-h-screen transition-colors duration-200 ${
        isDark ? "dark" : "light"
      }`}
    >
      <Sidebar
        activePage={activePage}
        onNavigate={changePage}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onSignOut={handleSignOut}
        userEmail={session.user.email ?? "No email available"}
      />

      <main
        className={`app-main min-h-screen min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="app-content mx-auto min-h-screen w-full max-w-7xl p-3 text-sm sm:p-5">
          <div className="app-content-scale">
            {expenseError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {expenseError}
                <button
                  onClick={() => setExpenseError("")}
                  className="ml-3 font-semibold underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {categoryError && !showCategoryManager && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {categoryError}
                <button
                  onClick={() => setCategoryError("")}
                  className="ml-3 font-semibold underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activePage === "Dashboard" && (
              <Dashboard
                expenses={expenses}
                budgets={budgetsWithSpending}
                onAddBudget={() => changePage("Budgets")}
                onViewAll={() => changePage("Expenses")}
              />
            )}

            {activePage === "Expenses" && (
              <Expenses
                expenses={expenses}
                budgets={budgetsWithSpending}
                notificationPreferences={notificationPreferences}
                filteredExpenses={filteredExpenses}
                paginatedExpenses={paginatedExpenses}
                showExpenseForm={showExpenseForm}
                editingExpense={editingExpense}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                itemsPerPage={itemsPerPage}
                categories={userCategories.map((category) => category.name)}
                onManageCategories={openCategoryManager}
                onAddExpense={openAddExpense}
                onGoToBudgets={() => changePage("Budgets")}
                onCancelExpenseForm={cancelExpenseForm}
                onSaveExpense={saveExpense}
                onSearchChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                onCategoryChange={(value) => {
                  setSelectedCategory(value);
                  setCurrentPage(1);
                }}
                onPageChange={setCurrentPage}
                onEdit={openEditExpense}
                onArchive={archiveExpense}
              />
            )}

            {activePage === "Budgets" && (
              <Budgets
                budgets={budgetsWithSpending}
                onAddBudget={addBudget}
                onUpdateBudget={updateBudget}
                onDeleteBudget={deleteBudget}
                notificationPreferences={notificationPreferences}
                onUpdateNotificationPreferences={
                  updateNotificationPreferences
                }
                notificationPreferencesLoading={
                  notificationPreferencesLoading
                }
              />
            )}

            {activePage === "Reports" && (
              <Reports expenses={expenses} />
            )}

            {activePage === "Archive" && (
              <Archive
                expenses={archivedExpenses}
                onRestore={restoreExpense}
                onDelete={permanentlyDeleteExpense}
              />
            )}

            {activePage === "Financial Literacy" && (
              <FinancialLiteracy />
            )}

            {activePage === "Settings" && (
              <Settings
                theme={theme}
                onThemeChange={setTheme}
                notificationPreferences={notificationPreferences}
                onUpdateNotificationPreferences={
                  updateNotificationPreferences
                }
                notificationPreferencesLoading={
                  notificationPreferencesLoading
                }
              />
            )}

            {activePage !== "Dashboard" &&
              activePage !== "Expenses" &&
              activePage !== "Budgets" &&
              activePage !== "Reports" &&
              activePage !== "Archive" &&
              activePage !== "Financial Literacy" &&
              activePage !== "Settings" && (
                <div className="app-card rounded-2xl border p-8 text-center">
                  <h2 className="text-lg font-bold">{activePage}</h2>
                  <p className="mt-2 text-sm opacity-70">
                    This section is not available yet.
                  </p>
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Personal category manager and first-login onboarding. */}
      {(showCategoryManager || showCategoryOnboarding) && (
        <CategoryManager
          initialCategories={onboardingCategories}
          defaultCategories={defaultCategories}
          onboarding={showCategoryOnboarding}
          saving={categoriesSaving}
          onSave={saveUserCategories}
          onClose={() => {
            // The onboarding dialog is intentionally not dismissible.
            // New users must save their categories to complete setup.
            if (!showCategoryOnboarding) {
              setShowCategoryManager(false);
              setCategoryError("");
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
