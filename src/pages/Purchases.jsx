import { FileImage, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { managerRoles } from "../utils/constants";
import { currency, getErrorMessage, number, shortDate } from "../utils/formatters";

const emptyForm = {
  itemId: "",
  quantity: "",
  unitPrice: "",
  supplierId: "",
  billNumber: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  note: ""
};

const Purchases = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole(managerRoles);
  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [billImage, setBillImage] = useState(null);
  const [filters, setFilters] = useState({ itemId: "", supplierId: "", startDate: "", endDate: "" });

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [purchaseRes, itemRes, supplierRes] = await Promise.all([
        api.get("/purchases", { params: filters }),
        api.get("/items", { params: { status: "active" } }),
        api.get("/suppliers", { params: { status: "active" } })
      ]);
      setPurchases(purchaseRes.data);
      setItems(itemRes.data);
      setSuppliers(supplierRes.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeRefresh(["purchases", "items"], () => loadData(false));

  const itemOptions = items.map((item) => ({ value: item._id, label: `${item.itemName} (${item.unit})` }));
  const supplierOptions = suppliers.map((supplier) => ({ value: supplier._id, label: supplier.supplierName }));
  const selectedItem = useMemo(() => items.find((item) => item._id === form.itemId), [items, form.itemId]);
  const totalPrice = Number(form.quantity || 0) * Number(form.unitPrice || 0);

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
    setBillImage(null);
    setModalOpen(true);
  };

  const submitPurchase = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (billImage) payload.append("billImage", billImage);
      await api.post("/purchases", payload, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Purchase added and stock increased", "success");
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
    { key: "supplier", header: "Supplier", render: (row) => row.supplierId?.supplierName },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "unitPrice", header: "Unit Price", render: (row) => currency(row.unitPrice) },
    { key: "totalPrice", header: "Total", render: (row) => <span className="font-semibold text-slate-900">{currency(row.totalPrice)}</span> },
    { key: "billNumber", header: "Bill No.", render: (row) => row.billNumber || "-" },
    { key: "purchaseDate", header: "Date", render: (row) => shortDate(row.purchaseDate) },
    {
      key: "billImage",
      header: "Bill",
      render: (row) => row.billImage?.url ? (
        <a className="inline-flex items-center gap-1 text-saffron-700 hover:underline" href={row.billImage.url} target="_blank" rel="noreferrer">
          <FileImage className="h-4 w-4" />
          View
        </a>
      ) : "-"
    }
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
            <select name="supplierId" value={filters.supplierId} onChange={handleFilterChange} className="input-shell">
              <option value="">All suppliers</option>
              {supplierOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
              Add Purchase
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable columns={columns} data={purchases} loading={loading} emptyTitle="No purchases found" emptyMessage="Add a purchase or adjust filters." />
      </section>

      <Modal
        open={modalOpen}
        title="Add Purchase"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="purchase-form" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Purchase"}</button>
          </>
        }
      >
        <form id="purchase-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitPurchase}>
          <FormInput label="Item" name="itemId" value={form.itemId} onChange={handleChange} options={itemOptions} required />
          <FormInput label="Supplier" name="supplierId" value={form.supplierId} onChange={handleChange} options={supplierOptions} required />
          <FormInput label="Quantity" name="quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={handleChange} required />
          <FormInput label="Unit Price" name="unitPrice" type="number" min="0" step="0.01" value={form.unitPrice} onChange={handleChange} required />
          <FormInput label="Bill Number" name="billNumber" value={form.billNumber} onChange={handleChange} />
          <FormInput label="Purchase Date" name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} />
          <label className="block">
            <span className="field-label">Bill Image</span>
            <input type="file" accept="image/*" onChange={(event) => setBillImage(event.target.files?.[0] || null)} className="input-shell mt-1" />
          </label>
          <div className="rounded-md border border-saffron-100 bg-saffron-50 p-3 text-sm dark:border-saffron-500/40 dark:bg-[#181512]">
            <p className="font-semibold text-saffron-800 dark:text-saffron-200">Calculated total</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{currency(totalPrice)}</p>
            {selectedItem ? <p className="text-xs text-slate-500 dark:text-slate-300">Current stock: {number(selectedItem.currentStock)} {selectedItem.unit}</p> : null}
          </div>
          <FormInput label="Note" name="note" value={form.note} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>
    </div>
  );
};

export default Purchases;
