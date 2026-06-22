import { useMemo } from "react";
import { usePageSearch } from "../context/PageSearchContext";
import EmptyState from "./EmptyState";
import Spinner from "./Spinner";

const flattenSearchValue = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => flattenSearchValue(item, seen)).join(" ");
  if (typeof value === "object") {
    if (seen.has(value)) return "";
    seen.add(value);
    return Object.values(value).map((item) => flattenSearchValue(item, seen)).join(" ");
  }
  return "";
};

const DataTable = ({ columns, data, loading, emptyTitle, emptyMessage, searchDisabled = false }) => {
  const { searchTerm } = usePageSearch();
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const rows = useMemo(() => {
    if (!normalizedSearch || searchDisabled) return data || [];
    return (data || []).filter((row) => flattenSearchValue(row).toLowerCase().includes(normalizedSearch));
  }, [data, normalizedSearch, searchDisabled]);

  if (loading) return <Spinner />;

  if (!rows.length) {
    return (
      <EmptyState
        title={normalizedSearch && !searchDisabled ? "No matching records" : emptyTitle}
        message={normalizedSearch && !searchDisabled ? "Try a different search term or clear the search field." : emptyMessage}
      />
    );
  }

  return (
    <div className="overflow-x-auto p-2">
      <table className="dashboard-table min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id || index} className="shadow-sm transition">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`border-y border-slate-100 px-4 py-3 align-middle text-slate-700 first:rounded-l-md first:border-l last:rounded-r-md last:border-r dark:border-slate-800 ${
                    column.wrap ? "max-w-xs whitespace-normal break-words leading-6" : "whitespace-nowrap"
                  } ${column.cellClassName || ""}`}
                >
                  {column.render ? column.render(row, index) : row[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
