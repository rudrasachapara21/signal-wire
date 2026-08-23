import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * requireAuth — gate an action behind authentication.
   *
   * If the user is logged in, `action` is called immediately.
   * If not, `action` is stored as a pending action and `onUnauthenticated`
   * is called (typically: navigate to /login). After a successful login or
   * signup, the stored action fires automatically.
   */
  requireAuth: (action: () => void, onUnauthenticated: () => void) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5001";

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    credentials: "include", // always send/receive the httpOnly sid cookie
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return data as { user: AuthUser };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking session on mount
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // ── Session restore on mount ───────────────────────────────────────────────
  // Call GET /api/auth/me to restore the session from the httpOnly cookie.
  // This means refreshing the page keeps the user logged in.
  useEffect(() => {
    apiFetch("/auth/me")
      .then(({ user: me }) => setUser(me))
      .catch(() => setUser(null)) // 401 = no session, not an error
      .finally(() => setIsLoading(false));
  }, []);

  const runPendingAction = useCallback(
    (currentPending: (() => void) | null) => {
      if (currentPending) {
        setTimeout(() => { currentPending(); }, 0);
        setPendingAction(null);
      }
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { user: loggedIn } = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(loggedIn);
        runPendingAction(pendingAction);
      } finally {
        setIsLoading(false);
      }
    },
    [pendingAction, runPendingAction],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const { user: created } = await apiFetch("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setUser(created);
        runPendingAction(pendingAction);
      } finally {
        setIsLoading(false);
      }
    },
    [pendingAction, runPendingAction],
  );

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setPendingAction(null);
  }, []);

  const requireAuth = useCallback(
    (action: () => void, onUnauthenticated: () => void) => {
      if (user) {
        action();
      } else {
        setPendingAction(() => action);
        onUnauthenticated();
      }
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, requireAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
