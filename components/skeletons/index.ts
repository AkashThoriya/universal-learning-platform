/**
 * Skeleton Components
 *
 * Reusable loading state components with shimmer effects and staggered animations.
 * Use these throughout the application for consistent loading experience.
 *
 * Usage:
 * ```tsx
 * import { StatCardSkeletonGrid, TestCardSkeletonGrid } from '@/components/skeletons';
 *
 * {loading ? <StatCardSkeletonGrid count={4} /> : <ActualContent />}
 * ```
 */

// Base components
export { SkeletonCard, ShimmerOverlay, SkeletonGrid } from './SkeletonCard';

// Specific skeletons
export { StatCardSkeleton, StatCardSkeletonGrid } from './StatCardSkeleton';
export { TestCardSkeleton, TestCardSkeletonGrid } from './TestCardSkeleton';
export { TestConfigSkeleton } from './TestConfigSkeleton';
export { RecommendationCardSkeleton, RecommendationCardSkeletonGrid } from './RecommendationCardSkeleton';
export { TestDetailSkeleton } from './TestDetailSkeleton';
export { ReviewPageSkeleton } from './ReviewPageSkeleton';
export * from './SyllabusSkeletons';
export * from './ProfileSkeleton';
export * from './DashboardSkeleton';

export * from './TestPageSkeleton';
export * from './SubjectsSkeleton';

export * from './MockLogSkeleton';
