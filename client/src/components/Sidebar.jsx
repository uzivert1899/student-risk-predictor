import axios from "axios";
import { Activity, LayoutDashboard, RotateCcw, Users } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
];

function Sidebar({ activeTab, onTabChange, onResetPredictions }) {
  const handleResetPredictions = async () => {
    const confirmed = window.confirm(
      "Reset all prediction history? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${apiBaseUrl}/api/students/reset-predictions`);
      await onResetPredictions();
    } catch (error) {
      console.error("Failed to reset prediction histories", error);
    }
  };

  return (
    <aside className="flex w-full flex-col rounded-[30px] border border-white/10 bg-white/5 p-6 text-white shadow-[0_0_45px_rgba(180,83,9,0.12)] backdrop-blur-xl md:w-72 lg:w-80">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner">
          <Activity className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl font-black tracking-tight text-white">
          Academic Vitals
        </h2>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isActive
                  ? "bg-gradient-to-r from-[#B45309] to-[#7F1D1D] text-white shadow-[0_0_24px_rgba(180,83,9,0.3)]"
                  : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleResetPredictions}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md md:mt-auto"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Demo Data
      </button>
    </aside>
  );
}

export default Sidebar;
