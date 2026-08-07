import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
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

// ─── Mock API helpers ────────────────────────────────────────────────────────

function deriveInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * TODO: replace with real API call to backend auth endpoint.
 * POST /api/auth/login  { email, password }
 * Returns: { user: { name, email } }
 */
async function mockLoginApi(
  email: string,
  _password: string,
): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  // Derive a display name from the email address for demo purposes
  const namePart = email.split("@")[0] ?? "User";
  const name = namePart
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, email, initials: deriveInitials(name) };
}

/**
 * TODO: replace with real API call to backend auth endpoint.
 * POST /api/auth/signup  { name, email, password }
 * Returns: { user: { name, email } }
 */
async function mockSignupApi(
  name: string,
  email: string,
  _password: string,
): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { name, email, initials: deriveInitials(name) };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const runPendingAction = useCallback(
    (currentPending: (() => void) | null) => {
      if (currentPending) {
        // Small tick to allow state updates to flush before the action runs
        setTimeout(() => {
          currentPending();
        }, 0);
        setPendingAction(null);
      }
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const loggedInUser = await mockLoginApi(email, password);
        setUser(loggedInUser);
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
        const newUser = await mockSignupApi(name, email, password);
        setUser(newUser);
        runPendingAction(pendingAction);
      } finally {
        setIsLoading(false);
      }
    },
    [pendingAction, runPendingAction],
  );

  const logout = useCallback(() => {
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
