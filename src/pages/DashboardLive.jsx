import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Gift,
  IndianRupee,
  Package,
  ReceiptText,
  Send,
  Sparkles,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import StatCard from "../components/StatCard";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { currency, getErrorMessage, number, shortDate } from "../utils/formatters";

const chartColors = ["#ff7a18", "#16a34a", "#3b82f6", "#eab308", "#14b8a6", "#ef4444", "#a855f7"];
const purchasePeriods = ["daily", "weekly", "monthly", "yearly"];

const DashboardLive = () => {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasePeriod, setPurchasePeriod] = useState("monthly");
  const [detailModal, setDetailModal] = useState({ open: false, metric: "", title: "", rows: [], loading: false });

  const loadDashboard = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await api.get("/dashboard", { params: { purchasePeriod } });
      setDashboard(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [purchasePeriod]);

  useRealtimeRefresh(["dashboard", "items", "stock", "purchases", "issues", "donations", "requests", "suppliers", "departments"], () => loadDashboard(false));

  const openMetric = async (metric) => {
    setDetailModal({ open: true, metric, title: "Loading", rows: [], loading: true });
    try {
      const { data } = await api.get(`/dashboard/metrics/${metric}`);
      setDetailModal({ open: true, metric, title: data.title, rows: data.rows, loading: false });
    } catch (error) {
      setDetailModal((current) => ({ ...current, loading: false }));
      showToast(getErrorMessage(error), "error");
    }
  };

  const summary = dashboard?.summary || {};
  const chartData = dashboard?.purchaseChart || dashboard?.monthlyPurchaseChart || [];
  const axisColor = isDark ? "#a9b8d4" : "#64748b";
  const gridColor = isDark ? "#313844" : "#e2e8f0";

  const purchaseColumns = [
    { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
    { key: "supplier", header: "Supplier", render: (row) => row.supplierId?.supplierName },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "totalPrice", header: "Amount", render: (row) => currency(row.totalPrice) },
    { key: "purchaseDate", header: "Date", render: (row) => shortDate(row.purchaseDate) }
  ];

  const issueColumns = [
    { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
    { key: "department", header: "Department", render: (row) => row.issuedToDepartment?.name },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "purpose", header: "Purpose" },
    { key: "issueDate", header: "Date", render: (row) => shortDate(row.issueDate) }
  ];

  const statCards = [
    { metric: "total-items", title: "Total Items", value: number(summary.totalItems), icon: Package, helper: "Active and inactive items", tone: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", glow: "rgba(255, 122, 24, 0.24)" },
    { metric: "low-stock", title: "Low Stock Items", value: number(summary.lowStockItems), icon: AlertTriangle, helper: "Needs attention", tone: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300", glow: "rgba(239, 68, 68, 0.2)" },
    { metric: "purchases-month", title: "Purchases This Month", value: number(summary.totalPurchasesThisMonth), icon: ReceiptText, helper: currency(summary.monthlyExpense), tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", glow: "rgba(59, 130, 246, 0.22)" },
    { metric: "issued-items", title: "Issued Items", value: number(summary.totalIssuedItems), icon: Send, helper: "Total quantity issued", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", glow: "rgba(16, 185, 129, 0.22)" },
    { metric: "donations", title: "Donations", value: number(summary.totalDonations), icon: Gift, helper: "Donation entries", tone: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300", glow: "rgba(217, 70, 239, 0.2)" },
    { metric: "pending-requests", title: "Pending Requests", value: number(summary.pendingRequests), icon: AlertTriangle, helper: "Awaiting approval", tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", glow: "rgba(245, 158, 11, 0.22)" },
    { metric: "suppliers", title: "Suppliers", value: number(summary.totalSuppliers), icon: Truck, helper: "Registered suppliers", tone: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300", glow: "rgba(20, 184, 166, 0.22)" },
    { metric: "monthly-expense", title: "Monthly Expense", value: currency(summary.monthlyExpense), icon: IndianRupee, helper: "Current month", tone: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-100", glow: "rgba(148, 163, 184, 0.22)" }
  ];

  const lowStockColumns = [
    { key: "itemName", header: "Item" },
    { key: "category", header: "Category" },
    { key: "stock", header: "Stock", render: (row) => `${number(row.currentStock)} ${row.unit}` },
    { key: "minimumStock", header: "Minimum", render: (row) => number(row.minimumStock) },
    { key: "status", header: "Status", render: () => <Badge tone="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30">Low stock</Badge> }
  ];

  const detailColumns = useMemo(() => {
    const sharedItemColumns = [
      { key: "itemName", header: "Item" },
      { key: "category", header: "Category" },
      { key: "currentStock", header: "Stock", render: (row) => `${number(row.currentStock)} ${row.unit || ""}` },
      { key: "minimumStock", header: "Minimum", render: (row) => number(row.minimumStock) },
      { key: "location", header: "Location", render: (row) => row.location || "-" }
    ];

    const columns = {
      "total-items": sharedItemColumns,
      "low-stock": sharedItemColumns,
      "purchases-month": purchaseColumns,
      "monthly-expense": purchaseColumns,
      "issued-items": issueColumns,
      donations: [
        { key: "donationDate", header: "Date", render: (row) => shortDate(row.donationDate) },
        { key: "donorName", header: "Donor" },
        { key: "itemName", header: "Item" },
        { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.unit}` },
        { key: "category", header: "Category" }
      ],
      "pending-requests": [
        { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
        { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
        { key: "department", header: "Department", render: (row) => row.department?.name },
        { key: "requestedBy", header: "Requested By", render: (row) => row.requestedBy?.name },
        { key: "reason", header: "Reason" }
      ],
      suppliers: [
        { key: "supplierName", header: "Supplier" },
        { key: "phone", header: "Phone", render: (row) => row.phone || "-" },
        { key: "email", header: "Email", render: (row) => row.email || "-" },
        { key: "itemsSupplied", header: "Items", render: (row) => row.itemsSupplied?.join(", ") || "-" },
        { key: "status", header: "Status", render: (row) => <Badge value={row.status}>{row.status}</Badge> }
      ]
    };

    return columns[detailModal.metric] || sharedItemColumns;
  }, [detailModal.metric]);

  if (loading) return <Spinner label="Loading dashboard" />;

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-saffron-700 dark:text-saffron-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Live inventory command center</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Aashram stock overview</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Click any summary card to inspect the records behind that number.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm font-bold text-saffron-800 dark:border-saffron-500/30 dark:bg-saffron-500/10 dark:text-saffron-200">
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.metric} {...card} onClick={() => openMetric(card.metric)} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="panel p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900">Purchase Trend</h2>
            <div className="flex flex-wrap gap-2">
              {purchasePeriods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPurchasePeriod(period)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition ${
                    purchasePeriod === period
                      ? "border-saffron-500 bg-saffron-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-saffron-300 dark:border-slate-700 dark:bg-[#101214] dark:text-slate-300"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ff7a18" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#ff7a18" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} />
                <Tooltip
                  formatter={(value, name) => (name === "expense" ? currency(value) : number(value))}
                  contentStyle={{
                    background: isDark ? "#101214" : "#ffffff",
                    border: `1px solid ${isDark ? "#3b414d" : "#e2e8f0"}`,
                    borderRadius: 8,
                    color: isDark ? "#f8fafc" : "#0f172a"
                  }}
                />
                <Area type="monotone" dataKey="expense" stroke="#ff7a18" fill="url(#expenseGradient)" strokeWidth={3} dot={{ r: 4, fill: "#ff7a18" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Category Stock</h2>
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboard?.categoryStockChart || []} dataKey="stock" nameKey="category" innerRadius={58} outerRadius={102} paddingAngle={4}>
                  {(dashboard?.categoryStockChart || []).map((entry, index) => (
                    <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => number(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-slate-900">Low Stock</h2>
          </div>
          <DataTable columns={lowStockColumns} data={dashboard?.lowStockItems || []} emptyTitle="No low stock items" emptyMessage="All items are above their minimum level." />
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-slate-900">Recent Purchases</h2>
          </div>
          <DataTable columns={purchaseColumns} data={dashboard?.recentPurchases || []} emptyTitle="No purchases yet" />
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-bold text-slate-900">Recent Stock Issues</h2>
        </div>
        <DataTable columns={issueColumns} data={dashboard?.recentIssues || []} emptyTitle="No stock issues yet" />
      </section>

      <Modal
        open={detailModal.open}
        title={`${detailModal.title} (${number(detailModal.rows.length)})`}
        onClose={() => setDetailModal({ open: false, metric: "", title: "", rows: [], loading: false })}
        size="max-w-6xl"
      >
        <DataTable columns={detailColumns} data={detailModal.rows} loading={detailModal.loading} emptyTitle="No data found" emptyMessage="This summary does not have matching records yet." />
      </Modal>
    </div>
  );
};

export default DashboardLive;
