import { LogOut, Menu, Moon, Search, Sun, Wifi, WifiOff } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { useTheme } from "../context/ThemeContext";

const titles = {
  "/": "Dashboard",
  "/items": "Items Management",
  "/purchases": "Purchase Management",
  "/issues": "Stock Issue Management",
  "/donations": "Donation Management",
  "/requests": "Request Management",
  "/suppliers": "Supplier Management",
  "/departments": "Department Management",
  "/reports": "Reports",
  "/users": "User Management"
};

const Navbar = ({ onMenu }) => {
  const { user, logout } = useAuth();
  const { connected } = useRealtime();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const title = useMemo(() => titles[location.pathname] || "Aashram Inventory", [location.pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-saffron-100 bg-ashram-cream/90 px-4 py-3 backdrop-blur-xl dark:bg-[#151515]/90 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-white lg:hidden" onClick={onMenu} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
            <p className="hidden text-sm font-medium text-slate-500 sm:block">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#0d0f10] md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Search within each module</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`hidden items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold md:inline-flex ${connected ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"}`}>
            {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            Live
          </span>
          <button type="button" className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:text-saffron-700 dark:border-slate-700 dark:bg-[#101214] dark:text-slate-200" onClick={toggleTheme} aria-label="Switch theme">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs font-semibold text-slate-500">{user?.role}</p>
          </div>
          <button type="button" className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:text-red-600" onClick={logout} aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
