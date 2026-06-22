import { Plus, Search, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { managerRoles } from "../utils/constants";
import { getErrorMessage, number, shortDate } from "../utils/formatters";

const emptyForm = {
  itemId: "",
  quantity: "",
  issuedToDepartment: "",
  purpose: "",
  issueDate: new Date().toISOString().slice(0, 10),
  note: ""
};

const StockIssues = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole(managerRoles);
  const [issues, setIssues] = useState([]);
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ itemId: "", departmentId: "", startDate: "", endDate: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [issueRes, itemRes, departmentRes] = await Promise.all([
        api.get("/issues", { params: filters }),
        api.get("/items", { params: { status: "active" } }),
        api.get("/departments", { params: { status: "active" } })
      ]);
      setIssues(issueRes.data);
      setItems(itemRes.data);
      setDepartments(departmentRes.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const itemOptions = items.map((item) => ({ value: item._id, label: `${item.itemName} (${item.currentStock} ${item.unit})` }));
  const departmentOptions = departments.map((department) => ({ value: department._id, label: department.name }));
  const selectedItem = useMemo(() => items.find((item) => item._id === form.itemId), [items, form.itemId]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadData();
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const submitIssue = async (event) => {
    event.preventDefault();
    if (selectedItem && Number(form.quantity) > selectedItem.currentStock) {
      showToast(`Available stock is ${selectedItem.currentStock} ${selectedItem.unit}`, "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/issues", form);
      showToast("Stock issued and inventory reduced", "success");
      setModalOpen(false);
      loadData();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "item",
      header: "Item",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.itemId?.itemName}</p>
          <p className="text-xs text-slate-500">{row.itemId?.category}</p>
        </div>
      )
    },
    { key: "department", header: "Department", render: (row) => row.issuedToDepartment?.name },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "purpose", header: "Purpose" },
    { key: "issuedBy", header: "Issued By", render: (row) => row.issuedBy?.name },
    { key: "issueDate", header: "Date", render: (row) => shortDate(row.issueDate) },
    { key: "status", header: "Movement", render: () => <Badge value="OUT">OUT</Badge> }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-4 xl:grid-cols-[1fr_1fr_150px_150px_auto]" onSubmit={applyFilters}>
            <select name="itemId" value={filters.itemId} onChange={handleFilterChange} className="input-shell">
              <option value="">All items</option>
              {itemOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange} className="input-shell">
              <option value="">All departments</option>
              {departmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-shell" />
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-shell" />
            <button type="submit" className="btn-secondary">
              <Search className="h-4 w-4" />
              Filter
            </button>
          </form>
          {canManage ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Issue Stock
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable columns={columns} data={issues} loading={loading} emptyTitle="No stock issues found" emptyMessage="Issue stock to departments or adjust filters." />
      </section>

      <Modal
        open={modalOpen}
        title="Issue Stock"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="issue-form" className="btn-primary" disabled={saving}>
              <Send className="h-4 w-4" />
              {saving ? "Issuing..." : "Issue Stock"}
            </button>
          </>
        }
      >
        <form id="issue-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitIssue}>
          <FormInput label="Item" name="itemId" value={form.itemId} onChange={handleChange} options={itemOptions} required />
          <FormInput label="Department" name="issuedToDepartment" value={form.issuedToDepartment} onChange={handleChange} options={departmentOptions} required />
          <FormInput label="Quantity" name="quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={handleChange} required />
          <FormInput label="Issue Date" name="issueDate" type="date" value={form.issueDate} onChange={handleChange} />
          <FormInput label="Purpose" name="purpose" value={form.purpose} onChange={handleChange} required />
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-700">Available stock</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {selectedItem ? `${number(selectedItem.currentStock)} ${selectedItem.unit}` : "-"}
            </p>
            {selectedItem && Number(form.quantity || 0) > selectedItem.currentStock ? (
              <p className="mt-1 text-xs font-semibold text-red-600">Quantity exceeds available stock</p>
            ) : null}
          </div>
          <FormInput label="Note" name="note" value={form.note} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>
    </div>
  );
};

export default StockIssues;
