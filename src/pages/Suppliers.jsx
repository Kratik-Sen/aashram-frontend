import { Edit3, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { managerRoles, statusTone } from "../utils/constants";
import { currency, getErrorMessage, number, shortDate } from "../utils/formatters";

const emptyForm = {
  supplierName: "",
  phone: "",
  email: "",
  address: "",
  itemsSupplied: "",
  status: "active"
};

const Suppliers = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole(managerRoles);
  const canDelete = hasRole(["Super Admin"]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, supplier: null, purchases: [] });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/suppliers", { params: filters });
      setSuppliers(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleFilterChange = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const applyFilters = (event) => {
    event.preventDefault();
    loadSuppliers();
  };

  const openCreate = () => {
    setEditingSupplier(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      supplierName: supplier.supplierName,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      itemsSupplied: supplier.itemsSupplied?.join(", ") || "",
      status: supplier.status
    });
    setModalOpen(true);
  };

  const submitSupplier = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier._id}`, form);
        showToast("Supplier updated", "success");
      } else {
        await api.post("/suppliers", form);
        showToast("Supplier created", "success");
      }
      setModalOpen(false);
      loadSuppliers();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async () => {
    setSaving(true);
    try {
      await api.delete(`/suppliers/${deleteTarget._id}`);
      showToast("Supplier deleted", "success");
      setDeleteTarget(null);
      loadSuppliers();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (supplier) => {
    try {
      const { data } = await api.get(`/suppliers/${supplier._id}`);
      setHistoryModal({ open: true, supplier: data.supplier, purchases: data.purchases });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const columns = [
    {
      key: "supplierName",
      header: "Supplier",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.supplierName}</p>
          <p className="text-xs text-slate-500">{row.phone || row.email || "-"}</p>
        </div>
      )
    },
    { key: "itemsSupplied", header: "Items", render: (row) => row.itemsSupplied?.join(", ") || "-" },
    { key: "address", header: "Address", render: (row) => row.address || "-" },
    { key: "status", header: "Status", render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-saffron-700" onClick={() => openHistory(row)} aria-label="View supplier history">
            <Eye className="h-4 w-4" />
          </button>
          {canManage ? (
            <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" onClick={() => openEdit(row)} aria-label="Edit supplier">
              <Edit3 className="h-4 w-4" />
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(row)} aria-label="Delete supplier">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )
    }
  ];

  const purchaseColumns = [
    { key: "purchaseDate", header: "Date", render: (row) => shortDate(row.purchaseDate) },
    { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "totalPrice", header: "Total", render: (row) => currency(row.totalPrice) },
    { key: "billNumber", header: "Bill No.", render: (row) => row.billNumber || "-" }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="flex flex-1 gap-3" onSubmit={applyFilters}>
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input name="search" value={filters.search} onChange={handleFilterChange} className="input-shell pl-9" placeholder="Search supplier, phone, email" />
            </label>
            <button type="submit" className="btn-secondary">Filter</button>
          </form>
          {canManage ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Supplier
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable columns={columns} data={suppliers} loading={loading} emptyTitle="No suppliers found" />
      </section>

      <Modal
        open={modalOpen}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="supplier-form" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Supplier"}</button>
          </>
        }
      >
        <form id="supplier-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitSupplier}>
          <FormInput label="Supplier Name" name="supplierName" value={form.supplierName} onChange={handleChange} required />
          <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <FormInput label="Status" name="status" value={form.status} onChange={handleChange} options={["active", "inactive"]} />
          <FormInput label="Address" name="address" value={form.address} onChange={handleChange} textarea className="md:col-span-2" />
          <FormInput label="Items Supplied" name="itemsSupplied" value={form.itemsSupplied} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>

      <Modal open={historyModal.open} title={`${historyModal.supplier?.supplierName || "Supplier"} Purchases`} onClose={() => setHistoryModal({ open: false, supplier: null, purchases: [] })} size="max-w-5xl">
        <DataTable columns={purchaseColumns} data={historyModal.purchases} emptyTitle="No purchases from this supplier" />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete supplier"
        message={`Delete ${deleteTarget?.supplierName}? Existing purchase records will keep their audit data.`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteSupplier}
      />
    </div>
  );
};

export default Suppliers;
