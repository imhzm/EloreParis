"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "./ops-pagination-controls.module.css";

export type PaginationState = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
};

type PaginationControlsProps = {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (currentPage > 3) pages.push("ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}

export function useClientPagination<T>(items: T[], initialPageSize = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    pagination: { currentPage, pageSize, totalItems },
    paginatedItems,
    goToPage,
    changePageSize,
  };
}

export function PaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const { currentPage, pageSize, totalItems } = pagination;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination} role="navigation" aria-label="التنقل بين الصفحات">
      <div className={styles.paginationInfo}>
        <span>{startItem}–{endItem} من {totalItems}</span>
        <label className={styles.pageSizeLabel}>
          <span>عرض</span>
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.currentTarget.value));
              onPageChange(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div className={styles.paginationPages}>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="الصفحة السابقة"
        >
          ‹
        </button>

        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={page}
              type="button"
              className={`${styles.pageButton} ${page === currentPage ? styles.pageButtonActive : ""}`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`الصفحة ${page}`}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="الصفحة التالية"
        >
          ›
        </button>
      </div>
    </div>
  );
}
