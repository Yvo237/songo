import SeedDisplay from './SeedDisplay';
import { cn } from '../utils/cn';

interface PitProps {
  seeds: number;
  isPlayable: boolean;
  isLastLanded: boolean;
  isCaptured: boolean;
  onClick: () => void;
}

export default function Pit({
  seeds,
  isPlayable,
  isLastLanded,
  isCaptured,
  onClick,
}: PitProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isPlayable}
      aria-label={`${seeds} graines`}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-200 select-none',
        'w-[38px] h-[38px] 2xs:w-[46px] 2xs:h-[46px] xs:w-[56px] xs:h-[56px] sm:w-[66px] sm:h-[66px] md:w-[78px] md:h-[78px]',
        'border border-[#3A2210]/60',
        isPlayable && [
          'cursor-pointer',
          'hover:scale-105',
          'hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]',
          'active:scale-[0.92]',
        ],
        !isPlayable && 'cursor-default',
        isLastLanded && 'shadow-[0_0_16px_rgba(251,191,36,0.35)]',
        isCaptured && 'shadow-[0_0_18px_rgba(239,68,68,0.4)]',
      )}
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #1A0D05 0%, #2C1A0B 55%, #3D2510 100%)',
        boxShadow: isLastLanded
          ? 'inset 0 6px 20px rgba(0,0,0,0.9), inset 0 -3px 8px rgba(60,40,15,0.15), 0 0 16px rgba(251,191,36,0.35)'
          : isCaptured
            ? 'inset 0 6px 20px rgba(0,0,0,0.9), inset 0 -3px 8px rgba(60,40,15,0.15), 0 0 18px rgba(239,68,68,0.4)'
            : 'inset 0 6px 20px rgba(0,0,0,0.9), inset 0 -3px 8px rgba(60,40,15,0.15)',
      }}
    >
      <SeedDisplay count={seeds} />

      {/* Count */}
      {seeds > 0 && (
        <span className="absolute -bottom-1.5 -right-1 z-10 flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full text-[8px] 2xs:text-[9px] font-bold leading-none bg-amber-100 text-amber-900 shadow border border-amber-300/50">
          {seeds}
        </span>
      )}
    </button>
  );
}
