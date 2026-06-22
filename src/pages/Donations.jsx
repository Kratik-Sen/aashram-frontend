import { Gift, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { categories, managerRoles, units } from "../utils/constants";
import { getErrorMessage, number, shortDate } from "../utils/formatters";

const emptyForm = {
  donorName: "",
  donorPhone: "",
  itemName: "",
  category: "",
  quantity: "",
  unit: "",
  donationDate: new Date().toISOString().slice(0, 10),
  note: ""
};

const Donations = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole(managerRoles);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });

  const loadDonations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/donations", { params: filters });
      setDonations(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadDonations();
  };

  const openCreate = () => {
    setForm(emptyForm);
    setImage(null);
    setModalOpen(true);
  };

  const submitDonation = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (image) payload.append("image", image);
      await api.post("/donations", payload, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Donation recorded and stock increased", "success");
      setModalOpen(false);
      loadDonations();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "donorName",
      header: "Donor",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.donorName}</p>
          <p className="text-xs text-slate-500">{row.donorPhone || "-"}</p>
        </div>
      )
    },
    {
      key: "itemName",
      header: "Item",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.itemName}</p>
          <p className="text-xs text-slate-500">{row.category}</p>
        </div>
      )
    },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.unit}` },
    { key: "recordedBy", header: "Recorded By", render: (row) => row.recordedBy?.name },
    { key: "donationDate", header: "Date", render: (row) => shortDate(row.donationDate) },
    { key: "movement", header: "Movement", render: () => <Badge value="IN">IN</Badge> },
    {
      key: "image",
      header: "Image",
      render: (row) => row.image?.url ? <a href={row.image.url} target="_blank" rel="noreferrer" className="text-saffron-700 hover:underline">View</a> : "-"
    }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_160px_160px_auto]" onSubmit={applyFilters}>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="input-shell">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
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
              Add Donation
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable columns={columns} data={donations} loading={loading} emptyTitle="No donations found" emptyMessage="Record donations or adjust filters." />
      </section>

      <Modal
        open={modalOpen}
        title="Add Donation"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="donation-form" className="btn-primary" disabled={saving}>
              <Gift className="h-4 w-4" />
              {saving ? "Saving..." : "Save Donation"}
            </button>
          </>
        }
      >
        <form id="donation-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitDonation}>
          <FormInput label="Donor Name" name="donorName" value={form.donorName} onChange={handleChange} required />
          <FormInput label="Donor Phone" name="donorPhone" value={form.donorPhone} onChange={handleChange} />
          <FormInput label="Item Name" name="itemName" value={form.itemName} onChange={handleChange} required />
          <FormInput label="Category" name="category" value={form.category} onChange={handleChange} options={categories} required />
          <FormInput label="Quantity" name="quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={handleChange} required />
          <FormInput label="Unit" name="unit" value={form.unit} onChange={handleChange} options={units} required />
          <FormInput label="Donation Date" name="donationDate" type="date" value={form.donationDate} onChange={handleChange} />
          <label className="block">
            <span className="field-label">Donation Image</span>
            <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} className="input-shell mt-1" />
          </label>
          <FormInput label="Note" name="note" value={form.note} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>
    </div>
  );
};

export default Donations;
