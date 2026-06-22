import { Edit3, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { categories, managerRoles, statusTone, units } from "../utils/constants";
import { getErrorMessage, number, shortDate } from "../utils/formatters";

const emptyForm = {
  itemName: "",
  category: "",
  unit: "",
  currentStock: 0,
  minimumStock: 0,
  location: "",
  description: "",
  status: "active"
};

const Items = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole(managerRoles);
  const canDelete = hasRole(["Super Admin"]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: "", category: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, item: null, transactions: [] });

  const loadItems = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await api.get("/items", { params: filters });
      setItems(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useRealtimeRefresh(["items", "stock"], () => loadItems(false));

  const filteredItems = useMemo(() => items, [items]);

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadItems();
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      minimumStock: item.minimumStock,
      location: item.location || "",
      description: item.description || "",
      status: item.status
    });
    setModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/items/${editingItem._id}`, form);
        showToast("Item updated", "success");
      } else {
        await api.post("/items", form);
        showToast("Item created", "success");
      }
      setModalOpen(false);
      loadItems();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/items/${deleteTarget._id}`);
      showToast("Item deleted", "success");
      setDeleteTarget(null);
      loadItems();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (item) => {
    try {
      const { data } = await api.get(`/items/${item._id}`);
      setHistoryModal({ open: true, item: data.item, transactions: data.transactions });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const columns = [
    {
      key: "itemName",
      header: "Item",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.itemName}</p>
          <p className="text-xs text-slate-500">{row.location || "No location"}</p>
        </div>
      )
    },
    { key: "category", header: "Category" },
    {
      key: "currentStock",
      header: "Stock",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{number(row.currentStock)} {row.unit}</span>
          {row.currentStock <= row.minimumStock ? <Badge tone="bg-red-50 text-red-700 border-red-200">Low</Badge> : null}
        </div>
      )
    },
    { key: "minimumStock", header: "Minimum", render: (row) => number(row.minimumStock) },
    { key: "status", header: "Status", render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-saffron-700" onClick={() => openHistory(row)} aria-label="View stock history">
            <Eye className="h-4 w-4" />
          </button>
          {canManage ? (
            <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" onClick={() => openEdit(row)} aria-label="Edit item">
              <Edit3 className="h-4 w-4" />
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(row)} aria-label="Delete item">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )
    }
  ];

  const historyColumns = [
    { key: "createdAt", header: "Date", render: (row) => shortDate(row.createdAt) },
    { key: "type", header: "Type", render: (row) => <Badge value={row.type}>{row.type}</Badge> },
    { key: "source", header: "Source" },
    { key: "quantity", header: "Qty", render: (row) => number(row.quantity) },
    { key: "previousStock", header: "Previous", render: (row) => number(row.previousStock) },
    { key: "newStock", header: "New", render: (row) => number(row.newStock) },
    { key: "performedBy", header: "By", render: (row) => row.performedBy?.name || "-" }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={applyFilters}>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input name="search" value={filters.search} onChange={handleFilterChange} className="input-shell pl-9" placeholder="Search item, category, location" />
            </label>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="input-shell">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <button type="submit" className="btn-secondary">Filter</button>
          </form>
          {canManage ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable columns={columns} data={filteredItems} loading={loading} emptyTitle="No items found" emptyMessage="Create your first item or change the filters." />
      </section>

      <Modal
        open={modalOpen}
        title={editingItem ? "Edit Item" : "Add Item"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="item-form" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Item"}</button>
          </>
        }
      >
        <form id="item-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitItem}>
          <FormInput label="Item Name" name="itemName" value={form.itemName} onChange={handleChange} required />
          <FormInput label="Category" name="category" value={form.category} onChange={handleChange} options={categories} required />
          <FormInput label="Unit" name="unit" value={form.unit} onChange={handleChange} options={units} required />
          {!editingItem ? <FormInput label="Current Stock" name="currentStock" type="number" min="0" value={form.currentStock} onChange={handleChange} /> : null}
          <FormInput label="Minimum Stock" name="minimumStock" type="number" min="0" value={form.minimumStock} onChange={handleChange} />
          <FormInput label="Location" name="location" value={form.location} onChange={handleChange} />
          <FormInput label="Status" name="status" value={form.status} onChange={handleChange} options={["active", "inactive"]} />
          <FormInput label="Description" name="description" value={form.description} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>

      <Modal open={historyModal.open} title={`${historyModal.item?.itemName || "Item"} Stock History`} onClose={() => setHistoryModal({ open: false, item: null, transactions: [] })} size="max-w-5xl">
        <DataTable columns={historyColumns} data={historyModal.transactions} emptyTitle="No stock transactions" emptyMessage="Transactions appear after purchases, donations, issues, or request issuance." />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete item"
        message={`Delete ${deleteTarget?.itemName}? Stock transaction history is preserved separately, but this item will no longer be available.`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteItem}
      />
    </div>
  );
};

export default Items;
