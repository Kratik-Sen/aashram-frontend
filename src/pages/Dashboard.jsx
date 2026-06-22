import {
  AlertTriangle,
  Building2,
  Gift,
  IndianRupee,
  Package,
  ReceiptText,
  Send,
  Truck
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import Spinner from "../components/Spinner";
import StatCard from "../components/StatCard";
import { useToast } from "../context/ToastContext";
import { currency, getErrorMessage, number, shortDate } from "../utils/formatters";

const chartColors = ["#f27e0c", "#2f6f4e", "#475569", "#d45f06", "#0f766e", "#64748b"];

const Dashboard = () => {
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get("/dashboard");
        setDashboard(data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [showToast]);

  if (loading) return <Spinner label="Loading dashboard" />;

  const summary = dashboard?.summary || {};

  const lowStockColumns = [
    { key: "itemName", header: "Item" },
    { key: "category", header: "Category" },
    { key: "stock", header: "Stock", render: (row) => `${number(row.currentStock)} ${row.unit}` },
    { key: "minimumStock", header: "Minimum", render: (row) => number(row.minimumStock) },
    { key: "status", header: "Status", render: (row) => <Badge tone="bg-red-50 text-red-700 border-red-200">Low stock</Badge> }
  ];

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

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Items" value={number(summary.totalItems)} icon={Package} helper="Active and inactive items" />
        <StatCard title="Low Stock Items" value={number(summary.lowStockItems)} icon={AlertTriangle} tone="bg-red-50 text-red-700" helper="Needs attention" />
        <StatCard title="Purchases This Month" value={number(summary.totalPurchasesThisMonth)} icon={ReceiptText} tone="bg-blue-50 text-blue-700" helper={currency(summary.monthlyExpense)} />
        <StatCard title="Issued Items" value={number(summary.totalIssuedItems)} icon={Send} tone="bg-emerald-50 text-emerald-700" helper="Total quantity issued" />
        <StatCard title="Donations" value={number(summary.totalDonations)} icon={Gift} tone="bg-purple-50 text-purple-700" helper="Donation entries" />
        <StatCard title="Pending Requests" value={number(summary.pendingRequests)} icon={AlertTriangle} tone="bg-amber-50 text-amber-700" helper="Awaiting approval" />
        <StatCard title="Suppliers" value={number(summary.totalSuppliers)} icon={Truck} tone="bg-teal-50 text-teal-700" helper="Registered suppliers" />
        <StatCard title="Monthly Expense" value={currency(summary.monthlyExpense)} icon={IndianRupee} tone="bg-slate-100 text-slate-700" helper="Current month" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Monthly Purchases</h2>
            <Badge tone="bg-saffron-50 text-saffron-700 border-saffron-200">Expense</Badge>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard?.monthlyPurchaseChart || []}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f27e0c" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#f27e0c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => currency(value)} />
                <Area type="monotone" dataKey="expense" stroke="#f27e0c" fill="url(#expenseGradient)" strokeWidth={3} />
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
                <Pie data={dashboard?.categoryStockChart || []} dataKey="stock" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={3}>
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
    </div>
  );
};

export default Dashboard;
