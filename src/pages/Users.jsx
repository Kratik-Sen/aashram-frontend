import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { roles, statusTone } from "../utils/constants";
import { getErrorMessage, shortDate } from "../utils/formatters";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "Viewer",
  department: "",
  status: "active"
};

const Users = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [userRes, departmentRes] = await Promise.all([
        api.get("/users", { params: filters }),
        api.get("/departments")
      ]);
      setUsers(userRes.data);
      setDepartments(departmentRes.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeRefresh(["users", "departments"], () => loadData(false));

  const departmentOptions = departments.map((department) => ({ value: department._id, label: department.name }));

  const handleFilterChange = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const applyFilters = (event) => {
    event.preventDefault();
    loadData();
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department?._id || "",
      status: user.status
    });
    setModalOpen(true);
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        delete payload.email;
        await api.put(`/users/${editingUser._id}`, payload);
        showToast("User updated", "success");
      } else {
        await api.post("/auth/register", form);
        showToast("User created", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      showToast("User deleted", "success");
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      )
    },
    { key: "role", header: "Role", render: (row) => <Badge tone="bg-saffron-50 text-saffron-700 border-saffron-200">{row.role}</Badge> },
    { key: "department", header: "Department", render: (row) => row.department?.name || "-" },
    { key: "status", header: "Status", render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    { key: "createdAt", header: "Created", render: (row) => shortDate(row.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" onClick={() => openEdit(row)} aria-label="Edit user">
            <Edit3 className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(row)} aria-label="Delete user">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_190px_150px_auto]" onSubmit={applyFilters}>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input name="search" value={filters.search} onChange={handleFilterChange} className="input-shell pl-9" placeholder="Search users" />
            </label>
            <select name="role" value={filters.role} onChange={handleFilterChange} className="input-shell">
              <option value="">All roles</option>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="input-shell">
              <option value="">Any status</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <button type="submit" className="btn-secondary">Filter</button>
          </form>
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <DataTable columns={columns} data={users} loading={loading} emptyTitle="No users found" />
      </section>

      <Modal
        open={modalOpen}
        title={editingUser ? "Edit User" : "Create User"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="user-form" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save User"}</button>
          </>
        }
      >
        <form id="user-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitUser}>
          <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required />
          <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={Boolean(editingUser)} />
          <FormInput label={editingUser ? "New Password" : "Password"} name="password" type="password" value={form.password} onChange={handleChange} required={!editingUser} />
          <FormInput label="Role" name="role" value={form.role} onChange={handleChange} options={roles} required />
          <FormInput label="Department" name="department" value={form.department} onChange={handleChange} options={departmentOptions} />
          <FormInput label="Status" name="status" value={form.status} onChange={handleChange} options={["active", "inactive"]} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message={`Delete ${deleteTarget?.name}? This cannot be used for future logins.`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
      />
    </div>
  );
};

export default Users;
