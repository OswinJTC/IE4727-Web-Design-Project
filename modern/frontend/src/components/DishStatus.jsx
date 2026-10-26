import Skeleton from '@mui/material/Skeleton';
import { homeGrid, menuGrid } from '../lib/ui';

// A dish card drawn in grey while the real one has not arrived. `compact` is the shorter home page card.
function DishCardSkeleton({ compact }) {
  return (
    <div className="min-h-[252px] overflow-hidden rounded-2xl border border-line bg-white p-[14px]" aria-hidden="true">
      <Skeleton variant="rounded" height={compact ? 150 : 180} sx={{ borderRadius: '12px', mb: '12px' }} />
      <Skeleton variant="text" width="65%" sx={{ fontSize: 18 }} />
      <Skeleton variant="text" sx={{ fontSize: 14 }} />
      <Skeleton variant="text" width="80%" sx={{ fontSize: 14, mb: '14px' }} />
      <Skeleton variant="text" width="30%" sx={{ fontSize: 22 }} />
    </div>
  );
}

// Skeleton cards in the same grid the dishes will use. The label is for screen readers.
export function DishesLoading({ label = 'Loading dishes…', count = 9, compact = false }) {
  return (
    <div className={compact ? homeGrid : menuGrid} aria-busy="true">
      <p className="sr-only" role="status">{label}</p>
      {Array.from({ length: count }, (_, i) => <DishCardSkeleton key={i} compact={compact} />)}
    </div>
  );
}

// Shown when the dishes could not be loaded
export function DishesFailed({ onRetry }) {
  return (
    <p className="py-7 font-body text-base text-muted" role="alert">
      Sorry, we could not load the dishes.{' '}
      <button type="button" className="inline font-black text-brand" onClick={onRetry}>Try again</button>
    </p>
  );
}
