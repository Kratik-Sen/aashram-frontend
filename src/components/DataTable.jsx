import EmptyState from "./EmptyState";
import Spinner from "./Spinner";

const DataTable = ({ columns, data, loading, emptyTitle, emptyMessage }) => {
  if (loading) return <Spinner />;

  if (!data?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row, index) => (
            <tr key={row._id || index} className="hover:bg-saffron-50/40">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 align-middle text-slate-700">
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
