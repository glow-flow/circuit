import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Hand,
  Play,
  X,
} from 'lucide-react';
import { markTutorialAsSeen } from '../../utils/presetStorage';
import { startTour } from '../../utils/tour';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  TEACHER_QUICK_CARDS,
  TeacherQuickCard,
  executeTeacherQuickCardAction,
  prepareCanvasForInteractiveMissionOne,
} from '../../tutorial/interactiveTutorialConfig';
import {
  WelcomeMiniCircuitDemo,
  WelcomeQuickCardVisual,
} from './welcome/WelcomeQuickCardVisual';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional callback to launch the 3-step hands-on interactive practice banner on the canvas. */
  onStartInteractivePractice?: () => void;
}

/**
 * Teacher & Student Quick-Start Guide Modal (`WelcomeModal.tsx`).
 *
 * Designed specifically for science teachers who are not digitally fluent and
 * grade-9 students:
 * 1. Offers a 1-click "Mulai Praktikum Interaktif (3 Langkah Langsung Coba)" that
 *    lets users learn by physically toggling the Knife Switch and deploying 12V green energy.
 * 2. Provides 4 "Kartu Contekan Guru 1-Klik" (Classroom Setup Cards) that immediately
 *    load ready-to-teach circuits (Basic Ohm, Parallel Branch, 12V Nature Station, Short-Circuit).
 * 3. Includes an interactive mini-preview of the pure-code SPST Knife Switch (`KnifeSwitchGraphic`).
 * 4. Retains the `driver.js` Spotlight button tour (`startTour`) as a secondary option.
 *
 * Time Complexity: O(1) render and interaction handlers.
 */
export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartInteractivePractice,
}) => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';
  const [previewSwitchOpen, setPreviewSwitchOpen] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleStartHandsOnPractice = () => {
    markTutorialAsSeen();
    prepareCanvasForInteractiveMissionOne();
    onClose();
    if (onStartInteractivePractice) {
      onStartInteractivePractice();
    } else {
      window.requestAnimationFrame(() => {
        startTour();
      });
    }
  };

  const handleStartSpotlightTour = () => {
    markTutorialAsSeen();
    onClose();
    window.requestAnimationFrame(() => {
      startTour();
    });
  };

  const handleSelectTeacherCard = (cardId: TeacherQuickCard['id']) => {
    markTutorialAsSeen();
    executeTeacherQuickCardAction(cardId);
    onClose();
  };

  const handleSkip = () => {
    markTutorialAsSeen();
    onClose();
  };

  const getAccentBorderClass = (accent: TeacherQuickCard['accentColor']) => {
    switch (accent) {
      case 'cyan':
        return 'border-electric-500/35 hover:border-electric-400';
      case 'amber':
        return 'border-amber-500/35 hover:border-amber-400';
      case 'emerald':
        return 'border-emerald-500/35 hover:border-emerald-400';
      case 'rose':
        return 'border-rose-500/35 hover:border-rose-400';
    }
  };

  const getAccentTextClass = (accent: TeacherQuickCard['accentColor']) => {
    switch (accent) {
      case 'cyan':
        return 'text-electric-300';
      case 'amber':
        return 'text-amber-300';
      case 'emerald':
        return 'text-emerald-300';
      case 'rose':
        return 'text-rose-300';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none"
      onClick={handleSkip}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-void-900 border border-white/15 shadow-2xl text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Interactive Pure-Code Switch Preview */}
        <div className="relative px-4 sm:px-5 pt-4 pb-3.5 border-b border-white/10 bg-void-950 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/assets/logo-circuit-sandbox.png"
                alt="Circuit Sandbox"
                width={28}
                height={28}
                fetchPriority="high"
                className="w-7 h-7 object-contain shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-[10px] font-mono font-semibold text-electric-400 tracking-wider uppercase truncate">
                  {isId
                    ? 'Panduan Cepat Guru & Siswa · IPA Kelas 9'
                    : 'Teacher & Student Quick-Start Guide'}
                </span>
                <h2
                  id="welcome-modal-title"
                  className="text-base sm:text-lg font-bold text-white tracking-tight leading-[1.15] truncate"
                >
                  {isId
                    ? 'Selamat Datang di Circuit Sandbox'
                    : 'Welcome to Circuit Sandbox'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              aria-label={isId ? 'Tutup' : 'Close'}
              className="w-10 h-10 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Mini Demo: Tap the Pure-Code Saklar + Lamp right here! */}
          <WelcomeMiniCircuitDemo
            isOpen={previewSwitchOpen}
            onToggle={() => setPreviewSwitchOpen((prev) => !prev)}
            isId={isId}
          />
        </div>

        {/* Scrollable Content: Primary Tutorial Actions + 2x2 Visual Quick Cards */}
        <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto">
          {/* Primary Action: 3-Step Hands-On Practice */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStartHandsOnPractice}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Hand className="w-4 h-4 shrink-0" />
              <span>
                {isId
                  ? 'Praktikum 3 Langkah (Langsung Coba)'
                  : '3-Step Interactive Practice'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleStartSpotlightTour}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span>{isId ? 'Tur Sorot Tombol' : 'Button Spotlight'}</span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>{isId ? 'Langsung Rakit' : 'Skip to Canvas'}</span>
              </button>
            </div>
          </div>

          {/* 2x2 Visual Schematic Quick-Start Grid */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-electric-400" />
                {isId
                  ? 'Pilih Skema 1-Klik (Siap Pakai)'
                  : '1-Click Visual Circuit Presets'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TEACHER_QUICK_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelectTeacherCard(card.id)}
                  className={`text-left p-2.5 rounded-xl bg-void-950 hover:bg-void-850 border transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-1.5 ${getAccentBorderClass(
                    card.accentColor
                  )}`}
                >
                  <div className="space-y-1.5">
                    <WelcomeQuickCardVisual cardId={card.id} />

                    <div>
                      <span
                        className={`block text-[8px] font-mono font-bold uppercase tracking-wider truncate ${getAccentTextClass(
                          card.accentColor
                        )}`}
                      >
                        {isId ? card.badgeId : card.badgeEn}
                      </span>
                      <div className="text-[11px] sm:text-xs font-bold text-white leading-tight mt-0.5">
                        {isId ? card.titleId : card.titleEn}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                        {isId ? card.descriptionId : card.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-200">
                    <span className={`truncate ${getAccentTextClass(card.accentColor)}`}>
                      {isId ? card.actionLabelId : card.actionLabelEn}
                    </span>
                    <Play className="w-2.5 h-2.5 fill-current opacity-80 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span>
              {isId
                ? 'Karya Orisinal: Kenzie Raka Romero (SMPN 12 Surabaya)'
                : 'Created by: Kenzie Raka Romero (SMPN 12 Surabaya)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
