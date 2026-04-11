import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4 py-6 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Showing <span className="text-slate-900">{startItem}</span> to <span className="text-slate-900">{endItem}</span> of <span className="text-slate-900">{totalItems}</span> results
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all border border-slate-100"
        >
          <ChevronLeft size={18} strokeWidth={3} />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Logic to show only a few page numbers if there are many
            if (
              totalPages > 7 &&
              page !== 1 &&
              page !== totalPages &&
              Math.abs(page - currentPage) > 1
            ) {
              if (Math.abs(page - currentPage) === 2) {
                return <span key={page} className="px-1 text-slate-300">...</span>;
              }
              return null;
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                  currentPage === page
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900 hover:text-slate-900'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all border border-slate-100"
        >
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
