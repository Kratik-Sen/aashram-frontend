import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/formatters";

const Login = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      showToast("Welcome back", "success");
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-ashram-cream lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-ashram-charcoal lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,126,12,0.22),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(47,111,78,0.28),transparent_30%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-saffron-600">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold">Aashram Inventory</p>
              <p className="text-sm text-saffron-100">Food, seva, donations, and store control</p>
            </div>
          </div>
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-saffron-200">Operations Dashboard</p>
            <h1 className="mt-4 text-5xl font-bold leading-tight">Inventory clarity for every department.</h1>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Manage purchases, stock issues, donations, requests, suppliers, departments, and reports from one protected system.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {["Stock logs", "Role access", "Reports"].map((label) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-saffron-100 bg-white p-6 shadow-soft">
          <div className="mb-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-saffron-50 text-saffron-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Aashram Inventory Management System</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
              <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} required className="[&_input]:pl-9" />
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
              <FormInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} required className="[&_input]:pl-9" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

        </div>
      </section>
    </main>
  );
};

export default Login;
