import { Check, PackageCheck, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { managerRoles, statusTone } from "../utils/constants";
import { getErrorMessage, number, shortDate } from "../utils/formatters";
import { unpackPaginatedResponse, withPagination } from "../utils/pagination";

const emptyForm = {
  itemId: "",
  quantity: "",
  department: "",
  reason: "",
  note: ""
};

const Requests = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const canAction = hasRole(managerRoles);
  const canCreate = hasRole([...managerRoles, "Kitchen Staff", "Department Staff"]);
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ status: "", departmentId: "" });

  const loadData = async (showLoader = true, page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else if (showLoader) setLoading(true);
    try {
      const [requestRes, itemRes, departmentRes] = await Promise.all([
        api.get("/requests", { params: withPagination(filters, page) }),
        api.get("/items", { params: { status: "active" } }),
        api.get("/departments", { params: { status: "active" } })
      ]);
      const { rows, pagination: nextPagination } = unpackPaginatedResponse(requestRes.data);
      setRequests((current) => append ? [...current, ...rows] : rows);
      setPagination(nextPagination);
      setItems(itemRes.data);
      setDepartments(departmentRes.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (append) setLoadingMore(false);
      else if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeRefresh(["requests", "items", "departments"], () => loadData(false));

  const itemOptions = items.map((item) => ({ value: item._id, label: `${item.itemName} (${item.currentStock} ${item.unit})` }));
  const departmentOptions = departments.map((department) => ({ value: department._id, label: department.name }));
  const selectedItem = useMemo(() => items.find((item) => item._id === form.itemId), [items, form.itemId]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      department: user?.department?._id || user?.department || ""
    });
    setModalOpen(true);
  };

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

  const submitRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/requests", form);
      showToast("Request created", "success");
      setModalOpen(false);
      loadData();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const updateRequest = async (id, action) => {
    setSaving(true);
    try {
      await api.put(`/requests/${id}/${action}`);
      const message = action === "issue" ? "Request issued and stock reduced" : `Request ${action}d`;
      showToast(message, "success");
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
          <p className="text-xs text-slate-500">Available: {number(row.itemId?.currentStock)} {row.itemId?.unit}</p>
        </div>
      )
    },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "department", header: "Department", render: (row) => row.department?.name },
    { key: "requestedBy", header: "Requested By", render: (row) => row.requestedBy?.name },
    { key: "reason", header: "Reason", wrap: true, cellClassName: "min-w-64" },
    { key: "status", header: "Status", render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    { key: "createdAt", header: "Date", render: (row) => shortDate(row.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => canAction ? (
        <div className="flex items-center gap-2">
          {row.status === "pending" ? (
            <>
              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => updateRequest(row._id, "approve")} disabled={saving} aria-label="Approve request">
                <Check className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => updateRequest(row._id, "reject")} disabled={saving} aria-label="Reject request">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : null}
          {row.status === "approved" ? (
            <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-saffron-50 hover:text-saffron-700" onClick={() => updateRequest(row._id, "issue")} disabled={saving} aria-label="Issue request">
              <PackageCheck className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : "-"
    }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={applyFilters}>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="input-shell">
              <option value="">All statuses</option>
              {["pending", "approved", "rejected", "issued"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange} className="input-shell">
              <option value="">All departments</option>
              {departmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="submit" className="btn-secondary">
              <Search className="h-4 w-4" />
              Filter
            </button>
          </form>
          {canCreate ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New Request
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          emptyTitle="No requests found"
          emptyMessage="Create a request or change filters."
          pagination={pagination}
          loadingMore={loadingMore}
          onLoadMore={() => loadData(false, (pagination?.page || 1) + 1, true)}
        />
      </section>

      <Modal
        open={modalOpen}
        title="Create Request"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="request-form" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Request"}</button>
          </>
        }
      >
        <form id="request-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitRequest}>
          <FormInput label="Item" name="itemId" value={form.itemId} onChange={handleChange} options={itemOptions} required />
          <FormInput label="Quantity" name="quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={handleChange} required />
          <FormInput label="Department" name="department" value={form.department} onChange={handleChange} options={departmentOptions} required />
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-700">Available stock</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{selectedItem ? `${number(selectedItem.currentStock)} ${selectedItem.unit}` : "-"}</p>
          </div>
          <FormInput label="Reason" name="reason" value={form.reason} onChange={handleChange} textarea required className="md:col-span-2" />
          <FormInput label="Note" name="note" value={form.note} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>
    </div>
  );
};

export default Requests;
