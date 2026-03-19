import type { ComponentType } from 'react';

type IconProps = { className?: string };

// ── Score Icons ──────────────────────────────────────────────

export const BildungIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5a3 3 0 0 1 3-1h5v16H6a3 3 0 0 0-3 1z"/>
    <path d="M21 5a3 3 0 0 0-3-1h-5v16h5a3 3 0 0 1 3 1z"/>
  </svg>
);

export const GemeinschaftIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="17" cy="9" r="2.5"/>
    <path d="M3 20c0-3 3-5 6-5s6 2 6 5"/>
    <path d="M14 20c0-2 2-3.5 4-3.5"/>
  </svg>
);

export const GlueckIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    <path d="M19 3v4M21 5h-4"/>
  </svg>
);

// ── Life Stage Icons ─────────────────────────────────────────

export const KindheitIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <circle cx="12" cy="10" r="4"/>
    <path d="M6 20c0-3.5 3-6 6-6s6 2.5 6 6"/>
  </svg>
);

export const JugendIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M6 9a6 6 0 0 1 12 0"/>
    <rect x="5" y="9" width="14" height="11" rx="3"/>
    <path d="M9 9v-2h6v2"/>
  </svg>
);

export const JungesErwachsenenalterIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M3 10l9-4 9 4-9 4z"/>
    <path d="M7 12v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4"/>
  </svg>
);

export const ErwachsenenalterIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <rect x="3" y="7" width="18" height="12" rx="2"/>
    <path d="M9 7V5h6v2"/>
  </svg>
);

export const AlterIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M5 19c10 0 14-6 14-14C9 5 5 9 5 19z"/>
    <path d="M5 19c5-5 9-9 14-14"/>
  </svg>
);

// ── Board Space Icons ────────────────────────────────────────

export const StartIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M5 3v18"/>
    <path d="M5 4h10l-2 4 2 4H5"/>
  </svg>
);

export const QuestionIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.8.6-1.5 1.2-1.5 2"/>
    <circle cx="12" cy="17" r="1"/>
  </svg>
);

export const EventIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <rect x="4" y="5" width="16" height="14" rx="2"/>
    <path d="M8 9h8M8 13h5"/>
  </svg>
);

export const MilestoneIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path d="M12 3l3 6 6 .8-4.5 4.2 1 6-5.5-3-5.5 3 1-6L3 9.8 9 9z"/>
  </svg>
);

export const BoostIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M5 19c4-1 8-5 10-10 0 0 3 3 3 7-5 2-9 6-10 10-4 0-6-2-6-7z"/>
    <path d="M9 15l-4 4"/>
  </svg>
);

export const SetbackIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path d="M12 3l10 18H2L12 3z"/>
    <path d="M12 9v4M12 17h.01"/>
  </svg>
);

export const ChanceIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
    <rect x="4" y="4" width="16" height="16" rx="3"/>
    <circle cx="8" cy="8" r="1"/>
    <circle cx="16" cy="16" r="1"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>
);

export const FinishIcon: ComponentType<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M8 21h8M12 17v4"/>
    <path d="M6 4h12v5a6 6 0 0 1-12 0V4z"/>
    <path d="M6 6H4a2 2 0 0 0 2 3"/>
    <path d="M18 6h2a2 2 0 0 1-2 3"/>
  </svg>
);
