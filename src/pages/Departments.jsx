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
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { statusTone } from "../utils/constants";
import { getErrorMessage, number, shortDate } from "../utils/formatters";
import { unpackPaginatedResponse, withPagination } from "../utils/pagination";

const emptyForm = {
  name: "",
  description: "",
  status: "active"
};

const Departments = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole(["Super Admin"]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, department: null, issues: [], requests: [] });

  const loadDepartments = async (showLoader = true, page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else if (showLoader) setLoading(true);
    try {
      const { data } = await api.get("/departments", { params: withPagination(filters, page) });
      const { rows, pagination: nextPagination } = unpackPaginatedResponse(data);
      setDepartments((current) => append ? [...current, ...rows] : rows);
      setPagination(nextPagination);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (append) setLoadingMore(false);
      else if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useRealtimeRefresh(["departments", "issues", "requests"], () => loadDepartments(false));

  const handleFilterChange = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const applyFilters = (event) => {
    event.preventDefault();
    loadDepartments();
  };

  const openCreate = () => {
    setEditingDepartment(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (department) => {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      description: department.description || "",
      status: department.status
    });
    setModalOpen(true);
  };

  const submitDepartment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment._id}`, form);
        showToast("Department updated", "success");
      } else {
        await api.post("/departments", form);
        showToast("Department created", "success");
      }
      setModalOpen(false);
      loadDepartments();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async () => {
    setSaving(true);
    try {
      await api.delete(`/departments/${deleteTarget._id}`);
      showToast("Department deleted", "success");
      setDeleteTarget(null);
      loadDepartments();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (department) => {
    try {
      const { data } = await api.get(`/departments/${department._id}`);
      setDetailModal({ open: true, department: data.department, issues: data.issues, requests: data.requests });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Department",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.description || "-"}</p>
        </div>
      )
    },
    { key: "status", header: "Status", render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    { key: "createdAt", header: "Created", render: (row) => shortDate(row.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-saffron-700" onClick={() => openDetails(row)} aria-label="View department details">
            <Eye className="h-4 w-4" />
          </button>
          {canManage ? (
            <>
              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" onClick={() => openEdit(row)} aria-label="Edit department">
                <Edit3 className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(row)} aria-label="Delete department">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      )
    }
  ];

  const issueColumns = [
    { key: "issueDate", header: "Date", render: (row) => shortDate(row.issueDate) },
    { key: "item", header: "Item", render: (row) => row.itemId?.itemName },
    { key: "quantity", header: "Qty", render: (row) => `${number(row.quantity)} ${row.itemId?.unit || ""}` },
    { key: "purpose", header: "Purpose" },
    { key: "issuedBy", header: "Issued By", render: (row) => row.issuedBy?.name }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="flex flex-1 gap-3" onSubmit={applyFilters}>
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input name="search" value={filters.search} onChange={handleFilterChange} className="input-shell pl-9" placeholder="Search department" />
            </label>
            <button type="submit" className="btn-secondary">Filter</button>
          </form>
          {canManage ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable
          columns={columns}
          data={departments}
          loading={loading}
          emptyTitle="No departments found"
          pagination={pagination}
          loadingMore={loadingMore}
          onLoadMore={() => loadDepartments(false, (pagination?.page || 1) + 1, true)}
        />
      </section>

      <Modal
        open={modalOpen}
        title={editingDepartment ? "Edit Department" : "Add Department"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="department-form" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Department"}</button>
          </>
        }
      >
        <form id="department-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitDepartment}>
          <FormInput label="Department Name" name="name" value={form.name} onChange={handleChange} required />
          <FormInput label="Status" name="status" value={form.status} onChange={handleChange} options={["active", "inactive"]} />
          <FormInput label="Description" name="description" value={form.description} onChange={handleChange} textarea className="md:col-span-2" />
        </form>
      </Modal>

      <Modal open={detailModal.open} title={`${detailModal.department?.name || "Department"} Issued Items`} onClose={() => setDetailModal({ open: false, department: null, issues: [], requests: [] })} size="max-w-5xl">
        <DataTable columns={issueColumns} data={detailModal.issues} emptyTitle="No issued items" />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete department"
        message="Are you sure you want to delete this?"
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteDepartment}
      />
    </div>
  );
};

export default Departments;
