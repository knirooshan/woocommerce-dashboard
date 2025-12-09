import { Filter } from "lucide-react";

const FilterBar = ({ children, showReset, onReset }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow border border-slate-800 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center text-slate-400 mr-2">
          <Filter className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        {children}
        {showReset && (
          <button
            onClick={onReset}
            className="ml-auto px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
