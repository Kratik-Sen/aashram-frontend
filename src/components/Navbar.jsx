import { Bell, BellOff, LogOut, Menu, Moon, Search, Sun, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { usePageSearch } from "../context/PageSearchContext";
import { useRealtime } from "../context/RealtimeContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { disableWebPushNotifications, enableWebPushNotifications, getWebPushStatus } from "../utils/webPush";

const titles = {
  "/": "Dashboard",
  "/items": "Items Management",
  "/purchases": "Purchase Management",
  "/issues": "Stock Issue Management",
  "/issue-by-admin": "Issue by Admin",
  "/donations": "Donation Management",
  "/requests": "Request Management",
  "/suppliers": "Supplier Management",
  "/departments": "Department Management",
  "/reports": "Reports",
  "/users": "User Management"
};

const Navbar = ({ onMenu }) => {
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm, clearSearch } = usePageSearch();
  const { connected } = useRealtime();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState({ supported: false, enabled: false, permission: "default" });
  const [pushLoading, setPushLoading] = useState(false);
  const title = useMemo(() => titles[location.pathname] || "Aashram Inventory", [location.pathname]);

  useEffect(() => {
    clearSearch();
  }, [clearSearch, location.pathname]);

  useEffect(() => {
    getWebPushStatus()
      .then(setPushStatus)
      .catch(() => setPushStatus({ supported: false, enabled: false, permission: "unsupported" }));
  }, [user]);

  const toggleNotifications = async () => {
    setPushLoading(true);
    try {
      const enabled = pushStatus.enabled
        ? !(await disableWebPushNotifications())
        : await enableWebPushNotifications();
      const nextStatus = await getWebPushStatus();
      const blocked = !enabled && nextStatus.permission === "denied";

      setPushStatus({ ...nextStatus, enabled });
      showToast(
        enabled ? "Notifications enabled" : blocked ? "Notifications are blocked in your browser" : "Notifications disabled",
        enabled || !blocked ? "success" : "error"
      );
    } catch (error) {
      showToast("Could not update notifications", "error");
    } finally {
      setPushLoading(false);
    }
  };

  const confirmLogout = async () => {
    await disableWebPushNotifications();
    setLogoutOpen(false);
    logout();
  };

  return (
    <>
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

        <label className="hidden max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#0d0f10] md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            placeholder="Search this page"
            aria-label="Search this page"
          />
        </label>

        <div className="flex items-center gap-3">
          <span className={`hidden items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold md:inline-flex ${connected ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"}`}>
            {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            Live
          </span>
          <button type="button" className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:text-saffron-700 dark:border-slate-700 dark:bg-[#101214] dark:text-slate-200" onClick={toggleTheme} aria-label="Switch theme">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {pushStatus.supported ? (
            <button
              type="button"
              className={`rounded-md border border-slate-200 bg-white p-2 transition dark:border-slate-700 dark:bg-[#101214] ${
                pushStatus.enabled ? "text-saffron-700 hover:text-red-600 dark:text-saffron-300" : "text-slate-600 hover:text-saffron-700 dark:text-slate-200"
              }`}
              onClick={toggleNotifications}
              disabled={pushLoading}
              aria-label={pushStatus.enabled ? "Disable notifications" : "Enable notifications"}
              title={pushStatus.enabled ? "Disable notifications" : "Enable notifications"}
            >
              {pushStatus.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </button>
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs font-semibold text-slate-500">{user?.role}</p>
          </div>
          <button type="button" className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:text-red-600" onClick={() => setLogoutOpen(true)} aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      </header>
      <ConfirmDialog
        open={logoutOpen}
        title="Logout"
        message="Do you want to logout?"
        confirmLabel="Logout"
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default Navbar;
