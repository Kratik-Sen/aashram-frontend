import {
  BarChart3,
  Building2,
  ClipboardList,
  Gift,
  Home,
  Package,
  ReceiptText,
  Send,
  ShieldCheck,
  Truck,
  Users,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Items", path: "/items", icon: Package },
  { label: "Purchases", path: "/purchases", icon: ReceiptText, roles: ["Super Admin", "Store Manager", "Viewer"] },
  { label: "Stock Issues", path: "/issues", icon: Send, roles: ["Super Admin", "Store Manager", "Viewer"] },
  { label: "Donations", path: "/donations", icon: Gift, roles: ["Super Admin", "Store Manager", "Viewer"] },
  { label: "Requests", path: "/requests", icon: ClipboardList },
  { label: "Suppliers", path: "/suppliers", icon: Truck, roles: ["Super Admin", "Store Manager", "Viewer"] },
  { label: "Departments", path: "/departments", icon: Building2, roles: ["Super Admin", "Viewer", "Store Manager"] },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Users", path: "/users", icon: Users, roles: ["Super Admin"] }
];

const Sidebar = ({ open, onClose }) => {
  const { user, hasRole } = useAuth();
  const visibleItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? "block" : "hidden"}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-saffron-100 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-saffron-100 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-saffron-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-saffron-700">Aashram</p>
              <p className="text-xs font-semibold text-slate-500">Inventory System</p>
            </div>
          </div>
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? "bg-saffron-50 text-saffron-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-saffron-100 p-4">
          <p className="text-sm font-bold text-slate-900">{user?.name}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{user?.role}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
