import Link from "next/link";

interface HistoryPaginationProps {
  basePath: string;
  page: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  itemLabel: string;
}

export function HistoryPagination({
  basePath,
  page,
  hasPreviousPage,
  hasNextPage,
  itemLabel,
}: HistoryPaginationProps) {
  if (!hasPreviousPage && !hasNextPage) {
    return null;
  }

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex items-center justify-between gap-3"
    >
      {hasPreviousPage ? (
        <Link
          href={_getPageHref(basePath, page - 1)}
          className="min-h-11 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500 hover:text-gray-950"
        >
          Newer {itemLabel}
        </Link>
      ) : (
        <span />
      )}
      {hasNextPage ? (
        <Link
          href={_getPageHref(basePath, page + 1)}
          className="min-h-11 rounded-md bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Older {itemLabel}
        </Link>
      ) : null}
    </nav>
  );
}

function _getPageHref(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}
