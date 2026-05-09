import { ChevronDown, Search } from 'lucide-react';

export function ControlBar() {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button className="px-5 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-bold text-[#1E293B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all flex items-center gap-2 shadow-sm">
        Sort by: Relevance
        <ChevronDown className="w-4 h-4" />
      </button>

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
        <input
          type="text"
          placeholder="Search in results..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-sm"
        />
      </div>

      <div className="flex-1">
        <input
          type="text"
          placeholder="Describe who you're meeting..."
          className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-sm"
        />
      </div>
    </div>
  );
}
