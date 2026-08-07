import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * useRequireAuth — returns a `guard` function that gates any action behind auth.
 *
 * Usage:
 *   const { guard } = useRequireAuth();
 *   <Button onClick={() => guard(() => { setAnalyzing(true); navigate({ to: '/strategy-report' }); })}>
 *     Generate my strategy
 *   </Button>
 *
 * If the user is logged in: action runs immediately.
 * If not: action is stored, user is sent to /login, action fires after login.
 */
export function useRequireAuth() {
  const { requireAuth } = useAuth();
  const navigate = useNavigate();

  const guard = useCallback(
    (action: () => void) => {
      requireAuth(action, () => {
        void navigate({ to: "/login" });
      });
    },
    [requireAuth, navigate],
  );

  return { guard };
}
