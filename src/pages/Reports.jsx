import { Download, Printer, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { useToast } from "../context/ToastContext";
import { categories } from "../utils/constants";
import { downloadCsv } from "../utils/csv";
import { currency, getErrorMessage, number, shortDate } from "../utils/formatters";

const reportTypes = [
  { value: "stock", label: "Stock Report" },
  { value: "purchases", label: "Purchase Report" },
  { value: "issues", label: "Issue Report" },
  { value: "donations", label: "Donation Report" },
  { value: "low-stock", label: "Low Stock Report" },
  { value: "monthly-expense", label: "Monthly Expense Report" },
  { value: "department-usage", label: "Department Usage Report" },
  { value: "transactions", label: "Stock Transaction Report" }
];

const Reports = () => {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState("stock");
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    itemId: "",
    supplierId: "",
    departmentId: ""
  });

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [itemRes, supplierRes, departmentRes] = await Promise.all([
          api.get("/items"),
          api.get("/suppliers"),
          api.get("/departments")
        ]);
        setItems(itemRes.data);
        setSuppliers(supplierRes.data);
        setDepartments(departmentRes.data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    };
    loadLookups();
  }, [showToast]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/${reportType}`, { params: filters });
      setRows(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const itemOptions = items.map((item) => ({ value: item._id, label: item.itemName }));
  const supplierOptions = suppliers.map((supplier) => ({ value: supplier._id, label: supplier.supplierName }));
  const departmentOptions = departments.map((department) => ({ value: department._id, label: department.name }));

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadReport();
  };

  const columnsByType = {
    stock: [
      { key: "itemName", header: "Item" },
      { key: "category", header: "Category" },
      { key: "currentStock", header: "Stock", render: (row) => `${number(row.currentStock)} ${row.unit}` },
      { key: "minimumStock", header: "Minimum", render: (row) => number(row.minimumStock) },
      { key: "location", header: "Location", render: (row) => row.location || "-" },
      { key: "status", header: "Status", render: (row) => <Badge value={row.status}>{row.status}</Badge> }
    ],
    purchases: [
      { key: "purchaseDate", header: "Date", render: (row) => shortDate(row.purchaseDate) },
      { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
      { key: "supplier", header: "Supplier", render: (row) => row.supplierId?.supplierName },
      { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
      { key: "totalPrice", header: "Total", render: (row) => currency(row.totalPrice) },
      { key: "purchasedBy", header: "By", render: (row) => row.purchasedBy?.name }
    ],
    issues: [
      { key: "issueDate", header: "Date", render: (row) => shortDate(row.issueDate) },
      { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
      { key: "department", header: "Department", render: (row) => row.issuedToDepartment?.name },
      { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
      { key: "purpose", header: "Purpose" },
      { key: "issuedBy", header: "By", render: (row) => row.issuedBy?.name }
    ],
    donations: [
      { key: "donationDate", header: "Date", render: (row) => shortDate(row.donationDate) },
      { key: "donorName", header: "Donor" },
      { key: "itemName", header: "Item" },
      { key: "category", header: "Category" },
      { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.unit}` },
      { key: "recordedBy", header: "By", render: (row) => row.recordedBy?.name }
    ],
    "low-stock": [
      { key: "itemName", header: "Item" },
      { key: "category", header: "Category" },
      { key: "currentStock", header: "Stock", render: (row) => `${number(row.currentStock)} ${row.unit}` },
      { key: "minimumStock", header: "Minimum", render: (row) => number(row.minimumStock) },
      { key: "location", header: "Location", render: (row) => row.location || "-" }
    ],
    "monthly-expense": [
      { key: "month", header: "Month" },
      { key: "purchases", header: "Purchases", render: (row) => number(row.purchases) },
      { key: "quantity", header: "Qty", render: (row) => number(row.quantity) },
      { key: "totalExpense", header: "Expense", render: (row) => currency(row.totalExpense) }
    ],
    "department-usage": [
      { key: "department", header: "Department" },
      { key: "issueCount", header: "Issues", render: (row) => number(row.issueCount) },
      { key: "totalQuantity", header: "Total Qty", render: (row) => number(row.totalQuantity) }
    ],
    transactions: [
      { key: "createdAt", header: "Date", render: (row) => shortDate(row.createdAt) },
      { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
      { key: "type", header: "Type", render: (row) => <Badge value={row.type}>{row.type}</Badge> },
      { key: "source", header: "Source" },
      { key: "quantity", header: "Qty", render: (row) => number(row.quantity) },
      { key: "previousStock", header: "Previous", render: (row) => number(row.previousStock) },
      { key: "newStock", header: "New", render: (row) => number(row.newStock) },
      { key: "performedBy", header: "By", render: (row) => row.performedBy?.name }
    ]
  };

  const columns = columnsByType[reportType] || columnsByType.stock;

  const csvRows = useMemo(() => rows.map((row) => {
    const output = {};
    columns.forEach((column) => {
      if (column.key === "item") output[column.header] = row.itemId?.itemName || "";
      else if (column.key === "supplier") output[column.header] = row.supplierId?.supplierName || "";
      else if (column.key === "department") output[column.header] = row.department || row.issuedToDepartment?.name || "";
      else if (column.key === "purchasedBy") output[column.header] = row.purchasedBy?.name || "";
      else if (column.key === "issuedBy") output[column.header] = row.issuedBy?.name || "";
      else if (column.key === "recordedBy") output[column.header] = row.recordedBy?.name || "";
      else if (column.key === "performedBy") output[column.header] = row.performedBy?.name || "";
      else output[column.header] = row[column.key] ?? "";
    });
    return output;
  }), [columns, rows]);

  const chartData = reportType === "monthly-expense"
    ? rows.map((row) => ({ label: row.month, value: row.totalExpense }))
    : reportType === "department-usage"
      ? rows.map((row) => ({ label: row.department, value: row.totalQuantity }))
      : [];

  return (
    <div className="space-y-5">
      <div className="panel p-4 no-print">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_150px_150px_180px_1fr_1fr_auto]" onSubmit={applyFilters}>
          <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="input-shell">
            {reportTypes.map((report) => <option key={report.value} value={report.value}>{report.label}</option>)}
          </select>
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-shell" />
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-shell" />
          <select name="category" value={filters.category} onChange={handleFilterChange} className="input-shell">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select name="itemId" value={filters.itemId} onChange={handleFilterChange} className="input-shell">
            <option value="">All items</option>
            {itemOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select name="supplierId" value={filters.supplierId} onChange={handleFilterChange} className="input-shell">
            <option value="">All suppliers</option>
            {supplierOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="btn-secondary">
              <Search className="h-4 w-4" />
              Run
            </button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange} className="input-shell max-w-xs">
            <option value="">All departments</option>
            {departmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" className="btn-secondary" onClick={() => downloadCsv(`${reportType}-report.csv`, csvRows)} disabled={!rows.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {chartData.length ? (
        <section className="panel p-4">
          <h2 className="mb-4 text-base font-bold text-slate-900">{reportTypes.find((report) => report.value === reportType)?.label}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => reportType === "monthly-expense" ? currency(value) : number(value)} />
                <Bar dataKey="value" fill="#2f6f4e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-bold text-slate-900">{reportTypes.find((report) => report.value === reportType)?.label}</h2>
        </div>
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No report data found" emptyMessage="Run a report or adjust filters." />
      </section>
    </div>
  );
};

export default Reports;
