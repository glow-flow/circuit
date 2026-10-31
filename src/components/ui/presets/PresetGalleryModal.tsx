import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  Gauge,
  X,
  Play,
  Trash2,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  BUILTIN_PRESET_CATALOG,
  PresetCategory,
  PresetDifficulty,
} from '../../../constants/presetCatalog';
import { PresetThumbnail } from './PresetThumbnail';
import { PresetConfirmDialog } from './PresetConfirmDialog';

interface PresetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Visual Preset Gallery Modal offering an interactive catalog of standard and custom circuits.
 * Includes search query filtering, category tabs, difficulty badges, and overwrite protection.
 *
 * Time Complexity: O(P) where P is the total count of presets.
 */
export const PresetGalleryModal: React.FC<PresetGalleryModalProps> = ({ isOpen, onClose }) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const customPresets = useCircuitStore((state) => state.customPresets);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const loadCustomPreset = useCircuitStore((state) => state.loadCustomPreset);
  const deleteCustomPreset = useCircuitStore((state) => state.deleteCustomPreset);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [pendingLoadTarget, setPendingLoadTarget] = useState<{
    id: string;
    title: string;
    isCustom: boolean;
  } | null>(null);

  // Filtered presets calculation
  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Process Built-in Presets
    const builtinMatches = BUILTIN_PRESET_CATALOG.filter((preset) => {
      // Category filter
      if (selectedCategory !== 'all' && selectedCategory !== 'custom' && preset.category !== selectedCategory) {
        return false;
      }
      if (selectedCategory === 'custom') {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'all' && preset.difficulty !== selectedDifficulty) {
        return false;
      }
      // Search query
      if (query) {
        const title = (isId ? preset.titleId : preset.titleEn).toLowerCase();
        const desc = (isId ? preset.descriptionId : preset.descriptionEn).toLowerCase();
        const componentText = preset.componentSummary
          .map((c) => (isId ? c.labelId : c.labelEn).toLowerCase())
          .join(' ');
        if (!title.includes(query) && !desc.includes(query) && !componentText.includes(query)) {
          return false;
        }
      }
      return true;
    });

    // 2. Process Custom User Presets
    const customMatches =
      selectedCategory === 'all' || selectedCategory === 'custom'
        ? customPresets
            .filter((custom) => {
              if (selectedDifficulty !== 'all') return false;
              if (query && !custom.name.toLowerCase().includes(query)) return false;
              return true;
            })
            .map((custom) => ({
              id: custom.id,
              isBuiltin: false,
              titleId: custom.name,
              titleEn: custom.name,
              descriptionId: `Rangkaian kustom karya Anda (${custom.nodes.length} komponen, ${custom.edges.length} kabel). Disimpan di memori browser.`,
              descriptionEn: `Your saved custom blueprint (${custom.nodes.length} parts, ${custom.edges.length} wires). Cached in browser storage.`,
              difficulty: 'intermediate' as PresetDifficulty,
              durationMinutes: 5,
              category: 'custom' as PresetCategory,
              componentSummary: [
                {
                  labelId: `${custom.nodes.length} Komponen`,
                  labelEn: `${custom.nodes.length} Components`,
                  count: custom.nodes.length,
                },
                {
                  labelId: `${custom.edges.length} Kabel`,
                  labelEn: `${custom.edges.length} Wires`,
                  count: custom.edges.length,
                },
              ],
            }))
        : [];

    return [...builtinMatches, ...customMatches];
  }, [searchQuery, selectedCategory, selectedDifficulty, customPresets, isId]);

  if (!isOpen) return null;

  const handleRequestLoad = (target: { id: string; title: string; isCustom: boolean }) => {
    // If canvas already contains active components, ask for confirmation first
    if (nodes.length > 0) {
      setPendingLoadTarget(target);
    } else {
      executeLoad(target);
    }
  };

  const executeLoad = (target: { id: string; isCustom: boolean }) => {
    if (target.isCustom) {
      loadCustomPreset(target.id);
    } else {
      loadPreset(target.id as any);
    }
    onClose();
  };

  const getDifficultyBadge = (diff: PresetDifficulty) => {
    switch (diff) {
      case 'beginner':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {isId ? 'Pemula' : 'Beginner'}
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {isId ? 'Menengah' : 'Intermediate'}
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
            {isId ? 'Mahir' : 'Advanced'}
          </span>
        );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-label="Galeri Rangkaian"
      >
        <div className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-void-900 border border-white/15 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-void-850 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>{isId ? 'Galeri Rangkaian Interaktif' : 'Interactive Preset Gallery'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-electric-500/10 text-electric-400 border border-electric-500/20">
                    {filteredPresets.length} {isId ? 'Rangkaian' : 'Circuits'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {isId
                    ? 'Eksplorasi blueprint standar kurikulum IPA Kelas 9 dan rangkaian kustom Anda'
                    : 'Explore curriculum-aligned Grade 9 DC blueprints and your custom circuits'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-900 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Tutup Galeri"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-white/10 bg-void-950/60 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search Field */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isId
                      ? 'Cari nama rangkaian, lampu, saklar, baterai...'
                      : 'Search circuits, bulbs, switches, batteries...'
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-void-900 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-electric-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Difficulty Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <Gauge className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-void-900 border border-white/10 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">{isId ? 'Semua Tingkat' : 'All Levels'}</option>
                  <option value="beginner">{isId ? 'Pemula (Dasar)' : 'Beginner'}</option>
                  <option value="intermediate">{isId ? 'Menengah' : 'Intermediate'}</option>
                  <option value="advanced">{isId ? 'Mahir (Smart Grid)' : 'Advanced'}</option>
                </select>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs select-none">
              {[
                { id: 'all', labelId: 'Semua', labelEn: 'All' },
                { id: 'basic', labelId: 'Rangkaian Dasar', labelEn: 'Basic DC' },
                { id: 'series_parallel', labelId: 'Seri & Paralel', labelEn: 'Series-Parallel' },
                { id: 'safety', labelId: 'Pengaman & Korslet', labelEn: 'Safety & Protection' },
                { id: 'power_grid', labelId: 'Smart Grid 9V', labelEn: 'Smart Grid 9V' },
                { id: 'custom', labelId: `Kustom Saya (${customPresets.length})`, labelEn: `My Presets (${customPresets.length})` },
              ].map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id as PresetCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                    selectedCategory === category.id
                      ? 'bg-electric-500 text-void-950 font-bold shadow-glow'
                      : 'bg-void-900 hover:bg-white/5 text-slate-300 border border-white/10'
                  }`}
                >
                  {isId ? category.labelId : category.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto overscroll-contain">
            {filteredPresets.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-void-950/50 rounded-2xl border border-white/5 space-y-2">
                <Search className="w-8 h-8 text-slate-600 mb-1" />
                <p className="text-sm font-semibold text-slate-300">
                  {isId ? 'Tidak ada rangkaian yang cocok' : 'No matching circuits found'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  {isId
                    ? 'Coba ganti kata kunci pencarian atau pilih kategori filter yang berbeda.'
                    : 'Try modifying your search terms or selecting a different category filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => {
                  const title = isId ? preset.titleId : preset.titleEn;
                  const desc = isId ? preset.descriptionId : preset.descriptionEn;

                  return (
                    <div
                      key={preset.id}
                      className="group bg-void-850 hover:bg-void-800 border border-white/10 hover:border-electric-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-electric-500/5"
                    >
                      <div className="space-y-3">
                        {/* Thumbnail Viewport */}
                        <div className="w-full h-28 overflow-hidden rounded-xl bg-void-950 border border-white/5 flex items-center justify-center relative">
                          <PresetThumbnail presetId={preset.id} category={preset.category} />
                          <div className="absolute top-2 right-2">
                            {getDifficultyBadge(preset.difficulty)}
                          </div>
                        </div>

                        {/* Title & Duration */}
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-electric-300 transition-colors line-clamp-1">
                              {title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-electric-400" />
                              {preset.durationMinutes} {isId ? 'menit' : 'mins'}
                            </span>
                            {!preset.isBuiltin && (
                              <span className="text-amber-400 font-sans font-semibold">
                                ★ {isId ? 'Kustom' : 'Custom'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                          {desc}
                        </p>

                        {/* Component Summary Chips */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {preset.componentSummary.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-void-950 text-slate-300 border border-white/5 font-mono"
                            >
                              {isId ? item.labelId : item.labelEn}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 mt-3 border-t border-white/10 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRequestLoad({
                              id: preset.id,
                              title,
                              isCustom: !preset.isBuiltin,
                            })
                          }
                          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-electric-500 hover:bg-electric-400 text-void-950 flex items-center justify-center gap-2 shadow-glow active:scale-95 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-void-950" />
                          <span>{isId ? 'Muat Rangkaian' : 'Load Circuit'}</span>
                        </button>

                        {!preset.isBuiltin && (
                          <button
                            type="button"
                            onClick={() => deleteCustomPreset(preset.id)}
                            title={isId ? 'Hapus preset ini' : 'Delete this preset'}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before replacing active circuit */}
      <PresetConfirmDialog
        isOpen={Boolean(pendingLoadTarget)}
        onClose={() => setPendingLoadTarget(null)}
        onConfirm={() => {
          if (pendingLoadTarget) {
            executeLoad(pendingLoadTarget);
            setPendingLoadTarget(null);
          }
        }}
        targetPresetTitle={pendingLoadTarget?.title ?? ''}
        componentCount={nodes.length}
        wireCount={edges.length}
        isIndonesian={isId}
      />
    </>
  );
};
