import React, { useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Clock,
  Gauge,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import {
  BUILTIN_PRESET_CATALOG,
  PresetCategory,
  PresetDifficulty,
} from '../../../constants/presetCatalog';
import { LabModalHeader } from '../common/LabModalHeader';
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

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen && !pendingLoadTarget, dialogRef, onClose);

  // Filtered presets calculation
  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Process Built-in Presets
    const builtinMatches = BUILTIN_PRESET_CATALOG.filter((preset) => {
      if (selectedCategory !== 'all' && selectedCategory !== 'custom' && preset.category !== selectedCategory) {
        return false;
      }
      if (selectedCategory === 'custom') {
        return false;
      }
      if (selectedDifficulty !== 'all' && preset.difficulty !== selectedDifficulty) {
        return false;
      }
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
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-void-900 text-emerald-400 border border-emerald-500/45">
            {isId ? 'Pemula' : 'Beginner'}
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-void-900 text-amber-400 border border-amber-500/45">
            {isId ? 'Menengah' : 'Intermediate'}
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-void-900 text-electric-400 border border-electric-500/45">
            {isId ? 'Mahir' : 'Advanced'}
          </span>
        );
    }
  };

  const countPill = (
    <span className="text-xs font-mono font-semibold tabular-nums px-2.5 py-1 rounded-lg bg-void-900 text-electric-400 border border-control">
      {filteredPresets.length} {isId ? 'Rangkaian' : 'Circuits'}
    </span>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-gallery-title"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-void-900 border border-control shadow-2xl text-ink flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <LabModalHeader
            titleId="preset-gallery-title"
            title={isId ? 'Galeri Rangkaian Interaktif' : 'Interactive Preset Gallery'}
            subtitle={
              isId
                ? 'Eksplorasi blueprint standar kurikulum IPA Kelas 9 dan rangkaian kustom Anda'
                : 'Explore curriculum-aligned Grade 9 DC blueprints and your custom circuits'
            }
            rightSlot={countPill}
            onClose={onClose}
            closeLabel={isId ? 'Tutup Galeri' : 'Close Gallery'}
          />

          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-ink/15 bg-void-950 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search Field */}
              <div className="relative flex-1 min-w-0">
                <label htmlFor="preset-search-input" className="sr-only">
                  {isId ? 'Cari rangkaian preset' : 'Search circuit presets'}
                </label>
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="preset-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isId
                      ? 'Cari nama rangkaian, lampu, saklar, baterai...'
                      : 'Search circuits, bulbs, switches, batteries...'
                  }
                  className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-lg bg-void-900 border border-control text-xs text-ink placeholder-slate-400 focus:border-electric-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={isId ? 'Hapus pencarian' : 'Clear search'}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg text-slate-400 hover:text-ink cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Difficulty Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
                <label htmlFor="preset-difficulty-select" className="sr-only">
                  {isId ? 'Filter tingkat kesulitan' : 'Filter difficulty level'}
                </label>
                <Gauge className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" aria-hidden="true" />
                <select
                  id="preset-difficulty-select"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full sm:w-auto min-w-0 truncate min-h-[44px] px-3 py-2 rounded-lg bg-void-900 border border-control text-xs text-ink cursor-pointer"
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
                  className={`min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors active:scale-95 cursor-pointer border ${
                    selectedCategory === category.id
                      ? 'bg-electric-600 border-electric-700 text-white font-bold'
                      : 'bg-void-900 hover:bg-void-850 text-ink border-control'
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
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-void-950 rounded-2xl border border-ink/15 space-y-2">
                <Search className="w-8 h-8 text-slate-400 mb-1" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink">
                  {isId ? 'Tidak ada rangkaian yang cocok' : 'No matching circuits found'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
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
                      className="group bg-void-850 hover:bg-void-800 border border-control hover:border-electric-500 rounded-2xl p-4 flex flex-col justify-between transition-colors shadow-sm"
                    >
                      <div className="space-y-3">
                        {/* Thumbnail Viewport */}
                        <div className="w-full h-28 overflow-hidden rounded-xl bg-void-950 border border-ink/15 flex items-center justify-center relative">
                          <PresetThumbnail presetId={preset.id} category={preset.category} />
                          <div className="absolute top-2 right-2">
                            {getDifficultyBadge(preset.difficulty)}
                          </div>
                        </div>

                        {/* Title & Duration */}
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <h3 className="text-xs sm:text-sm font-bold text-ink line-clamp-1">
                              {title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-electric-400" aria-hidden="true" />
                              {preset.durationMinutes} {isId ? 'menit' : 'mins'}
                            </span>
                            {!preset.isBuiltin && (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-sans font-semibold">
                                <Bookmark className="w-3 h-3" aria-hidden="true" />
                                {isId ? 'Kustom' : 'Custom'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                          {desc}
                        </p>

                        {/* Component Summary Chips */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {preset.componentSummary.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-void-950 text-slate-300 border border-ink/15 font-mono"
                            >
                              {isId ? item.labelId : item.labelEn}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 mt-3 border-t border-ink/15 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRequestLoad({
                              id: preset.id,
                              title,
                              isCustom: !preset.isBuiltin,
                            })
                          }
                          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-electric-600 hover:bg-electric-700 text-white flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
                          <span>{isId ? 'Muat Rangkaian' : 'Load Circuit'}</span>
                        </button>

                        {!preset.isBuiltin && (
                          <button
                            type="button"
                            onClick={() => deleteCustomPreset(preset.id)}
                            title={isId ? 'Hapus preset ini' : 'Delete this preset'}
                            aria-label={isId ? `Hapus preset ${title}` : `Delete preset ${title}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-950 hover:bg-danger-600 text-danger-400 hover:text-white border border-danger-500/45 active:scale-95 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
