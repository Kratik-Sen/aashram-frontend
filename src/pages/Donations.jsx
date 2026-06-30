import { Gift, Images, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { categories, managerRoles, units } from "../utils/constants";
import { getErrorMessage, number, shortDate } from "../utils/formatters";
import { unpackPaginatedResponse, withPagination } from "../utils/pagination";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [imageViewer, setImageViewer] = useState({ open: false, title: "", images: [] });
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });

  const loadDonations = async (showLoader = true, page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else if (showLoader) setLoading(true);
    try {
      const { data } = await api.get("/donations", { params: withPagination(filters, page) });
      const { rows, pagination: nextPagination } = unpackPaginatedResponse(data);
      setDonations((current) => append ? [...current, ...rows] : rows);
      setPagination(nextPagination);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (append) setLoadingMore(false);
      else if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  useRealtimeRefresh(["donations"], () => loadDonations(false));

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleImagesChange = (event) => {
    const selectedImages = Array.from(event.target.files || []);
    if (selectedImages.length > 3) {
      showToast("You can upload a maximum of 3 donation images", "error");
      event.target.value = "";
    }
    setImages(selectedImages.slice(0, 3));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadDonations();
  };

  const openCreate = () => {
    setForm(emptyForm);
    setImages([]);
    setModalOpen(true);
  };

  const submitDonation = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      images.forEach((image) => payload.append("images", image));
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

  const getDonationImages = (row) => {
    if (row.images?.length) return row.images;
    if (row.image?.url) return [row.image];
    return [];
  };

  const openImageViewer = (row) => {
    setImageViewer({
      open: true,
      title: `${row.donorName} donation images`,
      images: getDonationImages(row)
    });
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
      render: (row) => {
        const donationImages = getDonationImages(row);
        return donationImages.length ? (
          <button type="button" className="inline-flex items-center gap-1 text-saffron-700 hover:underline" onClick={() => openImageViewer(row)}>
            <Images className="h-4 w-4" />
            View
          </button>
        ) : "-";
      }
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
        <DataTable
          columns={columns}
          data={donations}
          loading={loading}
          emptyTitle="No donations found"
          emptyMessage="Record donations or adjust filters."
          pagination={pagination}
          loadingMore={loadingMore}
          onLoadMore={() => loadDonations(false, (pagination?.page || 1) + 1, true)}
        />
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
            <span className="field-label">Donation Images (max 3)</span>
            <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="input-shell mt-1" />
            {images.length ? <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-300">{images.length} image{images.length === 1 ? "" : "s"} selected</span> : null}
          </label>
          <FormInput label="Note" name="note" value={form.note} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>

      <Modal
        open={imageViewer.open}
        title={imageViewer.title || "Donation Images"}
        onClose={() => setImageViewer({ open: false, title: "", images: [] })}
        size="max-w-5xl"
      >
        <div className="flex flex-wrap justify-center gap-4">
          {imageViewer.images.map((image, index) => (
            <figure key={image.publicId || image.url || index} className="w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-[#0d0f10]">
              <img src={image.url} alt={`Donation ${index + 1}`} className="h-72 w-full object-contain" />
            </figure>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Donations;
