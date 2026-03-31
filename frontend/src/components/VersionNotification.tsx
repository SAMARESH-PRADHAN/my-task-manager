import { useEffect, useState } from "react";
import { X, Cpu } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function VersionNotification() {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem("version_notification_time");
    const now = Date.now();

    // 24 hours in milliseconds
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastShown || now - Number(lastShown) < twentyFourHours) {
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
      }, 15000); // show for 15 seconds

      // Save the time when notification first shown
      if (!lastShown) {
        localStorage.setItem("version_notification_time", now.toString());
      }

      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[999] animate-slideDown">
      <div className="w-[460px] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-lg shadow-2xl p-6 relative text-white">
        {/* Close Button */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
            <Cpu size={18} className="text-cyan-400" />
          </div>

          <div>
            <h3 className="font-semibold text-lg tracking-wide text-white">
              System Update
            </h3>

            <span className="text-xs text-cyan-300 font-medium tracking-wider">
              VERSION 1.0 RELEASED
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="mt-4 text-sm text-gray-200 leading-relaxed">
          Our platform now delivers faster performance, improved task
          management, and a smarter workflow system designed for both employees
          and administrators.
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span className="tracking-wide">CyberCity</span>

          <span className="font-semibold text-cyan-400">
            Blackmoon Technology
          </span>
        </div>
      </div>
    </div>
  );
}
