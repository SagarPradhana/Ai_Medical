import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

function DataPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing {from}-{to} of {totalItems} records
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-[12px] border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          <FaChevronLeft /> Prev
        </button>

        <span className="rounded-[12px] bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-[12px] border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          Next <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default DataPagination;
