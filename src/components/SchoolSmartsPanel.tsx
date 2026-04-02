import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

export interface SchoolFilters {
  sectors: string[];
  levels: string[];
}

interface SchoolSmartsPanelProps {
  onFiltersChange: (filters: SchoolFilters) => void;
  filters: SchoolFilters;
  isActive: boolean;
  onToggleActive: () => void;
}

export default function SchoolSmartsPanel({ onFiltersChange, filters, isActive, onToggleActive }: SchoolSmartsPanelProps) {
  const [open, setOpen] = useState(isActive); // Open by default if active

  const toggleSector = (sector: string) => {
    const newSectors = filters.sectors.includes(sector) 
      ? filters.sectors.filter(s => s !== sector) 
      : [...filters.sectors, sector];
    onFiltersChange({ sectors: newSectors, levels: filters.levels });
  };

  const toggleLevel = (level: string) => {
    const newLevels = filters.levels.includes(level) 
      ? filters.levels.filter(l => l !== level) 
      : [...filters.levels, level];
    onFiltersChange({ sectors: filters.sectors, levels: newLevels });
  };

  return (
    <section className={`relative z-10 rounded-[24px] border transition-all ${isActive ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 shadow-[0_0_40px_rgba(0,240,255,0.15)]' : 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 shadow-[0_0_30px_rgba(0,240,255,0.05)]'} backdrop-blur-md p-4 sm:p-5`}>
      <div className="w-full flex items-center justify-between gap-3 group">
        <button
          type="button"
          onClick={onToggleActive}
          className="flex items-center gap-3 flex-1 text-left select-none"
        >
          <div className={`p-2 rounded-xl border transition-all duration-300 ${isActive ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-110' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-105'}`}>
            <LucideIcons.GraduationCap size={18} className={isActive ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              SchoolSmarts Dashboard
            </h2>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Custom Educational Scoring</p>
          </div>
        </button>
        <button className="flex items-center gap-2 shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setOpen(!open)}>
          {isActive && !open && (
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 flex items-center h-6 text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              {filters.sectors.length + filters.levels.length} Filters
            </span>
          )}
          <LucideIcons.ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-5 border-t border-white/5 pt-5 pb-1">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
              <LucideIcons.Building size={12} />
              Institution Sector
            </span>
            <div className="flex flex-wrap gap-2">
              {['public', 'charter', 'private'].map(sector => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filters.sectors.includes(sector) ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  {sector.charAt(0).toUpperCase() + sector.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
              <LucideIcons.Users size={12} />
              Grade Level
            </span>
            <div className="flex flex-wrap gap-2">
              {['elementary', 'middle', 'high'].map(level => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filters.levels.includes(level) ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
