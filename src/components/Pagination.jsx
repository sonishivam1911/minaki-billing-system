import React from 'react';

/**
 * Pagination Component
 * Displays page numbers with navigation controls
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {number} props.maxVisiblePages - Maximum number of page buttons to show (default: 5)
 * @param {boolean} props.showFirstLast - Show first/last page buttons (default: true)
 * @param {boolean} props.disabled - Disable all pagination controls (default: false)
 */
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  disabled = false
}) => {
  if (totalPages <= 1) return null;

  // Calculate which page numbers to show
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (page) => {
    if (disabled || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <div className="pagination-controls">
        {/* First Page Button */}
        {showFirstLast && (
          <button
            className="pagination-button pagination-first"
            onClick={() => handlePageChange(1)}
            disabled={disabled || !canGoPrev}
            title="First Page"
          >
            «
          </button>
        )}

        {/* Previous Page Button */}
        <button
          className="pagination-button pagination-prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || !canGoPrev}
          title="Previous Page"
        >
          ‹
        </button>

        {/* Page Number Buttons */}
        <div className="pagination-pages">
          {/* Show ellipsis if there are pages before visible range */}
          {visiblePages[0] > 1 && (
            <>
              {visiblePages[0] > 2 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}

          {/* Render visible page numbers */}
          {visiblePages.map((page) => (
            <button
              key={page}
              className={`pagination-button pagination-page ${
                page === currentPage ? 'active' : ''
              }`}
              onClick={() => handlePageChange(page)}
              disabled={disabled}
              title={`Page ${page}`}
            >
              {page}
            </button>
          ))}

          {/* Show ellipsis if there are pages after visible range */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}
        </div>

        {/* Next Page Button */}
        <button
          className="pagination-button pagination-next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || !canGoNext}
          title="Next Page"
        >
          ›
        </button>

        {/* Last Page Button */}
        {showFirstLast && (
          <button
            className="pagination-button pagination-last"
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled || !canGoNext}
            title="Last Page"
          >
            »
          </button>
        )}
      </div>
    </div>
  );
};