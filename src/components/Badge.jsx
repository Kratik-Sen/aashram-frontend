import { statusTone } from "../utils/constants";

const Badge = ({ children, value, tone }) => {
  const className = tone || statusTone[value] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children || value}
    </span>
  );
};

export default Badge;
