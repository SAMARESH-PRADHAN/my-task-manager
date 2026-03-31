import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const INACTIVITY_TIMEOUT = 10 * 1000; // 5 minutes

export const useInactivityLogout = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

    resetTimer();
    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, resetTimer]);
};