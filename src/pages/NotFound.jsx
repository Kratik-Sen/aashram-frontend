import { Link } from "react-router-dom";

const NotFound = () => (
  <main className="flex min-h-screen items-center justify-center bg-ashram-cream px-4">
    <div className="max-w-md rounded-lg border border-saffron-100 bg-white p-8 text-center shadow-soft">
      <p className="text-sm font-bold uppercase tracking-wide text-saffron-700">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">The page you are looking for is not available in this inventory system.</p>
      <Link to="/" className="btn-primary mt-6">
        Go to dashboard
      </Link>
    </div>
  </main>
);

export default NotFound;
