import EmptyState from "./EmptyState";
import Spinner from "./Spinner";

const DataTable = ({ columns, data, loading, emptyTitle, emptyMessage }) => {
  if (loading) return <Spinner />;

  if (!data?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
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
          {data.map((row, index) => (
            <tr key={row._id || index} className="shadow-sm transition">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap border-y border-slate-100 px-4 py-3 align-middle text-slate-700 first:rounded-l-md first:border-l last:rounded-r-md last:border-r dark:border-slate-800">
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
