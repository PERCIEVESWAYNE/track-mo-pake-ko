
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

type AuthMode = "login" | "register" | "forgot" | "recovery";

type AuthProps = {
  recoveryMode?: boolean;
  onRecoveryComplete?: () => void;
};

const AUTH_NOTICE_KEY = "track-mo-auth-notice";
const VERIFIED_NOTICE_KEY = "track-mo-email-verified";

export default function Auth({
  recoveryMode = false,
  onRecoveryComplete,
}: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(
    recoveryMode ? "recovery" : "login"
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Read the email verification success message.
  const [message, setMessage] = useState(() => {
    try {
      const notice = sessionStorage.getItem(VERIFIED_NOTICE_KEY);

      if (notice) {
        sessionStorage.removeItem(VERIFIED_NOTICE_KEY);
      }

      return notice ?? "";
    } catch {
      return "";
    }
  });

  // Read the account deactivation or authentication notice.
  const [error, setError] = useState(() => {
    try {
      const notice = sessionStorage.getItem(AUTH_NOTICE_KEY);

      if (notice) {
        sessionStorage.removeItem(AUTH_NOTICE_KEY);
      }

      return notice ?? "";
    } catch {
      return "";
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recoveryMode) {
      setMode("recovery");
      setError("");
      setMessage("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [recoveryMode]);

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  function clearAuthNotice() {
    try {
      sessionStorage.removeItem(AUTH_NOTICE_KEY);
    } catch {
      // Authentication can continue if sessionStorage is unavailable.
    }

    setError("");
  }

  function dismissError() {
    clearAuthNotice();
  }

  function changeMode(newMode: AuthMode) {
    clearAuthNotice();
    setMode(newMode);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    clearAuthNotice();

    // PASSWORD RECOVERY
    if (mode === "recovery") {
      if (password.length < 8) {
        setError("Your password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }

      setLoading(true);

      try {
        const { error: updateError } =
          await supabase.auth.updateUser({ password });

        if (updateError) throw updateError;

        setMessage(
          "Your password has been updated successfully. You can now sign in using your new password."
        );

        setPassword("");
        setConfirmPassword("");

        await supabase.auth.signOut();

        setMode("login");
        setEmail("");

        onRecoveryComplete?.();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update your password. Please try again."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // EMAIL VALIDATION
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setError("Please enter your password.");
      return;
    }

    // REGISTRATION VALIDATION
    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (password.length < 8) {
        setError("Your password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      // REGISTER
      if (mode === "register") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
              emailRedirectTo: `${window.location.origin}/?verified=1`,
            },
          });

        if (signUpError) throw signUpError;

        if (data.session) {
          setMessage(
            "Your account was created, but email confirmation is not currently required by Supabase. Please check your authentication settings."
          );
        } else {
          setMessage(
            "Check your email! We've sent a confirmation link to your email address. Please verify your email to activate your account."
          );

          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setFullName("");
        }
      }

      // LOGIN - SHARED BY ADMIN AND USER
      else if (mode === "login") {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) throw loginError;

        // App.tsx verifies the profile, role, and account status.
        setMessage("Login successful. Verifying your account...");
      }

      // FORGOT PASSWORD
      else if (mode === "forgot") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo: window.location.origin,
            }
          );

        if (resetError) throw resetError;

        setMessage(
          "If an account exists for this email, a password reset link will be sent."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isRecovery = mode === "recovery";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Track Mo, Pake ko!
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {isRegister
              ? "Create your account to start tracking your expenses."
              : isForgot
                ? "Enter your email to receive a password reset link."
                : isRecovery
                  ? "Create a new password for your account."
                  : "Welcome back! Sign in to manage your money."}
          </p>
        </div>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="leading-relaxed">{error}</p>

            <button
              type="button"
              onClick={dismissError}
              aria-label="Dismiss error message"
              className="shrink-0 rounded p-1 text-red-600 transition hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}

          {!isRecovery && (
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}

          {!isForgot && (
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {isRecovery ? "New password" : "Password"}
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isRegister || isRecovery
                      ? "new-password"
                      : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isRegister || isRecovery
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  minLength={
                    isRegister || isRecovery ? 8 : undefined
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-emerald-600"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>
          )}

          {(isRegister || isRecovery) && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm {isRecovery ? "new " : ""}password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Re-enter your password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-emerald-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>
          )}

          {!isRegister && !isForgot && !isRecovery && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => changeMode("forgot")}
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : isForgot
                  ? "Send reset link"
                  : isRecovery
                    ? "Update Password"
                    : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isForgot || isRecovery ? (
            <button
              type="button"
              onClick={async () => {
                if (isRecovery) {
                  await supabase.auth.signOut();
                  onRecoveryComplete?.();
                }

                changeMode("login");
              }}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Back to sign in
            </button>
          ) : isRegister ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => changeMode("login")}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => changeMode("register")}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Create one
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
