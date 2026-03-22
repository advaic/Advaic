import { type ReactNode } from "react";

type TableRow = Record<string, ReactNode>;

type TableColumn<Row extends TableRow> = {
  key: keyof Row & string;
  label: string;
  emphasize?: boolean;
  render?: (row: Row) => ReactNode;
  mobileLabel?: string;
  mobileRender?: (row: Row) => ReactNode;
};

type ResponsiveComparisonTableProps<Row extends TableRow> = {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
};

export default function ResponsiveComparisonTable<Row extends TableRow>({
  columns,
  rows,
  rowKey,
}: ResponsiveComparisonTableProps<Row>) {
  const [primaryColumn, ...detailColumns] = columns;

  const getCellContent = (column: TableColumn<Row>, row: Row) =>
    column.render ? column.render(row) : row[column.key];
  const getMobileContent = (column: TableColumn<Row>, row: Row) =>
    column.mobileRender ? column.mobileRender(row) : getCellContent(column, row);

  return (
    <>
      <div className="mt-8 grid gap-3 md:hidden">
        {rows.map((row) => (
          <article key={rowKey(row)} className="card-base p-5">
            <p className="label">{primaryColumn.mobileLabel ?? primaryColumn.label}</p>
            <div className="mt-2 text-base font-semibold leading-6 text-[var(--text)]">
              {getCellContent(primaryColumn, row)}
            </div>
            <div className="mt-4 space-y-3">
              {detailColumns.map((column) => (
                <div
                  key={column.key}
                  className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    {column.mobileLabel ?? column.label}
                  </p>
                  <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{getMobileContent(column, row)}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 hidden overflow-x-auto rounded-[var(--radius)] bg-white ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold text-[var(--text)]">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-[var(--border)] align-top last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={
                      column.emphasize
                        ? "px-4 py-4 font-medium text-[var(--text)]"
                        : "px-4 py-4 text-[var(--muted)]"
                    }
                  >
                    {getCellContent(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
