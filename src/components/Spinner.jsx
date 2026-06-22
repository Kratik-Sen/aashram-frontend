const Spinner = ({ label = "Loading" }) => (
  <div className="flex items-center justify-center gap-3 py-10 text-sm font-semibold text-slate-500">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-saffron-200 border-t-saffron-600" />
    {label}
  </div>
);

export default Spinner;
