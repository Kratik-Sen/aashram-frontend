import { PackageCheck, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { getErrorMessage, number, shortDate } from "../utils/formatters";
import { unpackPaginatedResponse, withPagination } from "../utils/pagination";

const emptyRequestForm = {
  itemId: "",
  quantity: "",
  reason: "",
  note: ""
};

const IssuedByAdmin = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const departmentId = user?.department?._id || user?.department || "";
  const [issues, setIssues] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyRequestForm);

  const loadData = async (showLoader = true, page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else if (showLoader) setLoading(true);
    try {
      const issueParams = departmentId ? { departmentId } : {};
      const [issueRes, itemRes] = await Promise.all([
        api.get("/issues", { params: withPagination(issueParams, page) }),
        api.get("/items", { params: { status: "active" } })
      ]);
      const { rows, pagination: nextPagination } = unpackPaginatedResponse(issueRes.data);
      setIssues((current) => append ? [...current, ...rows] : rows);
      setPagination(nextPagination);
      setItems(itemRes.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (append) setLoadingMore(false);
      else if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentId]);

  useRealtimeRefresh(["issues", "items"], () => loadData(false));

  const itemOptions = items.map((item) => ({ value: item._id, label: `${item.itemName} (${item.currentStock} ${item.unit})` }));
  const selectedItem = useMemo(() => items.find((item) => item._id === form.itemId), [items, form.itemId]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const openRequest = () => {
    setForm(emptyRequestForm);
    setModalOpen(true);
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!departmentId) {
      showToast("Your user account is not linked with a department", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/requests", { ...form, department: departmentId });
      showToast("Request sent to admin", "success");
      setModalOpen(false);
      setForm(emptyRequestForm);
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
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "purpose", header: "Purpose", wrap: true, cellClassName: "min-w-56" },
    { key: "issuedBy", header: "Issued By", render: (row) => row.issuedBy?.name || "-" },
    { key: "issueDate", header: "Date", render: (row) => shortDate(row.issueDate) },
    { key: "movement", header: "Movement", render: () => <Badge value="OUT">OUT</Badge> }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Items issued to your department</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{user?.department?.name || "Your department"} stock issues from admin records.</p>
          </div>
          <button type="button" className="btn-primary" onClick={openRequest}>
            <Plus className="h-4 w-4" />
            Request Item
          </button>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable
          columns={columns}
          data={issues}
          loading={loading}
          emptyTitle="No issued items found"
          emptyMessage="Items issued from the admin stock issue page will appear here."
          pagination={pagination}
          loadingMore={loadingMore}
          onLoadMore={() => loadData(false, (pagination?.page || 1) + 1, true)}
        />
      </section>

      <Modal
        open={modalOpen}
        title="Request Item from Admin"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="issued-request-form" className="btn-primary" disabled={saving}>
              <PackageCheck className="h-4 w-4" />
              {saving ? "Sending..." : "Send Request"}
            </button>
          </>
        }
      >
        <form id="issued-request-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitRequest}>
          <FormInput label="Item" name="itemId" value={form.itemId} onChange={handleChange} options={itemOptions} required />
          <FormInput label="Quantity" name="quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={handleChange} required />
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-[#181b20]">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Available stock</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedItem ? `${number(selectedItem.currentStock)} ${selectedItem.unit}` : "-"}</p>
          </div>
          <FormInput label="Reason" name="reason" value={form.reason} onChange={handleChange} textarea required className="md:col-span-2" />
          <FormInput label="Note" name="note" value={form.note} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>
    </div>
  );
};

export default IssuedByAdmin;
