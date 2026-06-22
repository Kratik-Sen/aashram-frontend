import { PackageOpen } from "lucide-react";

const EmptyState = ({ title = "No records found", message = "Add records or adjust filters to see data here." }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
    <PackageOpen className="h-10 w-10 text-slate-300" />
    <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
  </div>
);

export default EmptyState;
