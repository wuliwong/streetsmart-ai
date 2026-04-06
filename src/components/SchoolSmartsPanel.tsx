import * as LucideIcons from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [expanded, setExpanded] = useState(isActive);

  // Turning off collapses the panel; turning on expands it
  useEffect(() => { setExpanded(isActive); }, [isActive]);

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

      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Icon */}
        <div className={`shrink-0 p-2 rounded-xl border transition-all duration-300 ${isActive ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
          <LucideIcons.GraduationCap size={18} />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white tracking-wide">SchoolSmarts</h2>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">School Ratings</p>
        </div>

        {/* Toggle switch + label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-bold tracking-wide transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            {isActive ? 'On' : 'Off'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={onToggleActive}
            className={`relative flex-shrink-0 rounded-full border transition-all duration-300 focus:outline-none ${isActive ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'bg-white/10 border-white/20'}`}
            style={{ width: '2.5rem', height: '1.375rem' }}
            aria-label={isActive ? 'Disable school filter' : 'Enable school filter'}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${isActive ? 'translate-x-[1.125rem] bg-black' : 'translate-x-0 bg-white/60'}`} />
          </button>

          {/* Chevron — always visible, independently expands/collapses filter detail */}
          <button
            type="button"
            className="p-1 hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? 'Collapse filters' : 'Expand filters'}
          >
            <LucideIcons.ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Filter content — shown when expanded, regardless of on/off ── */}
      {expanded && (
        <div className="mt-5 space-y-5 border-t border-white/5 pt-5 pb-1">

          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
              <LucideIcons.Building size={12} />
              Institution Sector
            </span>
            <div className="flex flex-wrap gap-2">
              {(['public', 'charter', 'private'] as const).map(sector => {
                const active = filters.sectors.includes(sector);
                return (
                  <button
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${active ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'}`}
                  >
                    {active && <LucideIcons.Check size={11} strokeWidth={3} />}
                    {sector.charAt(0).toUpperCase() + sector.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
              <LucideIcons.Users size={12} />
              Grade Level
            </span>
            <div className="flex flex-wrap gap-2">
              {(['elementary', 'middle', 'high'] as const).map(level => {
                const active = filters.levels.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${active ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'}`}
                  >
                    {active && <LucideIcons.Check size={11} strokeWidth={3} />}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
