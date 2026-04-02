import { useEffect, useState } from "react";
import { X, Wrench, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const NOTIF_KEY = "version_notification_time_v2";
const DURATION = 60000;

export default function VersionNotification() {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastShown = localStorage.getItem(NOTIF_KEY);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastShown || now - Number(lastShown) > twentyFourHours) {
      setShow(true);
      localStorage.setItem(NOTIF_KEY, now.toString());

      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev - 100 / (DURATION / 100);
          return next <= 0 ? 0 : next;
        });
      }, 100);

      const timer = setTimeout(() => {
        setShow(false);
      }, DURATION);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, []);

  if (!show) return null;

  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes fadeTag {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }

        .notif-card {
          animation: slideDown 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          font-family: 'Syne', sans-serif;
        }
        .notif-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #67e8f9 0%, #ffffff 40%, #67e8f9 60%, #a5f3fc 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .pulse-ring {
          animation: pulse-ring 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }
        .blink-tag {
          animation: fadeTag 2s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[999] notif-card">
        <div
          className="relative w-[490px] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(10,14,23,0.92) 0%, rgba(17,24,39,0.95) 100%)"
              : "linear-gradient(135deg, rgba(15,23,42,0.93) 0%, rgba(30,41,59,0.96) 100%)",
            border: "1px solid rgba(103,232,249,0.18)",
            boxShadow:
              "0 0 0 1px rgba(103,232,249,0.06), 0 25px 50px rgba(0,0,0,0.55), 0 0 80px rgba(34,211,238,0.07)",
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(103,232,249,0.7), rgba(167,139,250,0.5), transparent)",
            }}
          />

          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(103,232,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,1) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Animated icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className="pulse-ring absolute inset-0 rounded-xl"
                    style={{ background: "rgba(34,211,238,0.2)" }}
                  />
                  <div
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(103,232,249,0.1))",
                      border: "1px solid rgba(103,232,249,0.35)",
                    }}
                  >
                    <Wrench size={17} className="text-cyan-300" />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-base tracking-tight shimmer-text">
                      v1.0 is Live
                    </h3>
                    <span
                      className="notif-mono blink-tag text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(34,211,238,0.12)",
                        border: "1px solid rgba(34,211,238,0.3)",
                        color: "#67e8f9",
                        letterSpacing: "0.1em",
                      }}
                    >
                      STABLE
                    </span>
                  </div>
                  <p
                    className="notif-mono text-[10px] mt-0.5 tracking-widest font-medium"
                    style={{ color: "rgba(103,232,249,0.65)" }}
                  >
                    BUGS FIXED — MORE COMING SOON
                  </p>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() => setShow(false)}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(156,163,175,0.8)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(239,68,68,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(239,68,68,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(156,163,175,0.8)";
                }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Divider */}
            <div
              className="my-4 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(103,232,249,0.15), transparent)",
              }}
            />

            {/* Feature chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["✅ Previous Bugs Fixed", "⚡ v1.0 Stable", "🛠️ WP Completion Soon"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="notif-mono text-[10px] px-2 py-1 rounded-md"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(203,213,225,0.8)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {tag}
                  </span>
                )
              )}
            </div>

            {/* Description */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(148,163,184,0.9)" }}
            >
              <span style={{ color: "#86efac", fontWeight: 600 }}>
                Version 1.0 is now live
              </span>{" "}
              with all previously reported bugs resolved. The platform is stable
              and ready for full use. Stay tuned —{" "}
              <span style={{ color: "#67e8f9", fontWeight: 600 }}>
                Manual WP Completion
              </span>{" "}
              is currently in development and will be rolling out in the{" "}
              <span style={{ color: "#c4b5fd", fontWeight: 600 }}>
                coming days
              </span>
              .
            </p>

            {/* Coming soon note */}
            <div
              className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2"
              style={{
                background: "rgba(167,139,250,0.07)",
                border: "1px solid rgba(167,139,250,0.2)",
              }}
            >
              <span className="text-purple-400 text-xs mt-0.5">🛠️</span>
              <p
                className="notif-mono text-[10px] leading-relaxed"
                style={{ color: "rgba(196,181,253,0.85)" }}
              >
                Manual WP Completion feature is under active development.
                No action needed — it will be available without any reinstallation.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#67e8f9",
                    boxShadow: "0 0 6px rgba(103,232,249,0.8)",
                  }}
                />
                <span
                  className="notif-mono text-[10px] tracking-widest"
                  style={{ color: "rgba(103,232,249,0.6)" }}
                >
                  BLACKMOON TECHNOLOGY
                </span>
              </div>

              <button
                className="flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-200 group"
                style={{ color: "rgba(103,232,249,0.85)" }}
                onClick={() => setShow(false)}
              >
                <span>Dismiss</span>
                <ArrowRight
                  size={11}
                  className="group-hover:translate-x-0.5 transition-transform duration-150"
                />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[3px] w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg, rgba(103,232,249,0.9), rgba(167,139,250,0.8))",
                boxShadow: "0 0 8px rgba(103,232,249,0.5)",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}