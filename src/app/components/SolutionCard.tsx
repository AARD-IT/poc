import { Star } from 'lucide-react';

interface SolutionCardProps {
  rank: number;
  title: string;
  description: string;
  tags: string[];
  date: string;
  featured?: boolean;
  onClick: () => void;
}

const tagColors: Record<string, string> = {
  AI: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',
  'Gen AI': 'bg-[#EDE9FE] text-[#6D28D9] border-[#C4B5FD]',
  Analytics: 'bg-[#E0E7FF] text-[#4338CA] border-[#A5B4FC]',
  Finance: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
  Healthcare: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]',
  Retail: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]',
  Dashboard: 'bg-[#E0E7FF] text-[#4F46E5] border-[#A5B4FC]',
  Automation: 'bg-[#FCE7F3] text-[#BE185D] border-[#F9A8D4]',
  'Power BI': 'bg-[#FEF3C7] text-[#A16207] border-[#FDE68A]',
  Python: 'bg-[#CCFBF1] text-[#0F766E] border-[#5EEAD4]',
  Demo: 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]',
  Legal: 'bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE]',
};

export function SolutionCard({
  rank,
  title,
  description,
  tags,
  date,
  featured,
  onClick,
}: SolutionCardProps) {
  const visibleTags = tags.slice(0, 4);
  const remainingCount = tags.length - visibleTags.length;

  return (
    <div
      onClick={onClick}
      className="bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.12)] hover:border-[#94A3B8] transition-all cursor-pointer"
      style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#475569]">#{rank}</span>
          <Star className="w-5 h-5 text-[#0284C7] fill-[#0284C7]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-[#1E293B] text-lg leading-tight">{title}</h3>
            {featured && (
              <span className="px-2.5 py-1 text-xs font-bold bg-[#0F766E] text-white rounded-md shadow-sm">
                Featured
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[15px] font-medium text-[#475569] mb-4 line-clamp-3 leading-relaxed">{description}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                tagColors[tag] || 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]'
              }`}
            >
              {tag}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold bg-[#E5E7EB] text-[#374151] rounded-md border border-[#D1D5DB]">
              +{remainingCount} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t-[1.5px] border-[#CBD5E1]">
        <span className="text-xs font-semibold text-[#475569]">{date}</span>
      </div>
    </div>
  );
}
