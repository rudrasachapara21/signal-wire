import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Megaphone, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Login() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      void navigate({ to: "/overview" });
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await login(email, password);
      // If there's a pendingAction it fires automatically inside AuthContext.
      // Otherwise navigate to overview as the default landing.
      void navigate({ to: "/overview" });
    } catch {
      setError("Login failed. Please check your credentials and try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3 sm:mb-10">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Megaphone size={20} />
          </span>
          <span className="font-display text-xl font-bold">Signal Wire</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to generate and save your ad strategies.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
            noValidate
            id="login-form"
          >
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <label className="block text-sm font-medium text-foreground">
              Email address
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
            </label>

            {/* Password */}
            <label className="block text-sm font-medium text-foreground">
              Password
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
            </label>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full"
              disabled={isLoading}
              id="login-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline"
              id="signup-link"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Continue as guest */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Just browsing?{" "}
          <Link
            to="/overview"
            className="font-medium text-foreground hover:underline"
            id="guest-continue-link"
          >
            Continue as guest
          </Link>
        </p>
      </div>
    </div>
  );
}
