import { TrendingUp } from "lucide-react";

const StatCard = ({ title, value, icon: Icon = TrendingUp, helper, tone = "bg-saffron-50 text-saffron-700" }) => (
  <div className="panel p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {helper ? <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p> : null}
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

export default StatCard;
