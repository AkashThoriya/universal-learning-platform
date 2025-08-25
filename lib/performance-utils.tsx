/**
 * @fileoverview Performance Optimization Utilities
 *
 * Comprehensive performance optimization tools including memoization,
 * virtualization helpers, bundle optimization, and performance monitoring.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Enhanced memo with custom comparison function
 */
function smartMemo<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: any, nextProps: any) => boolean
): React.MemoExoticComponent<T> {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `SmartMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Shallow comparison for React.memo
 */
function shallowEqual(prevProps: Record<string, any>, nextProps: Record<string, any>): boolean {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for complex objects (use sparingly)
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) { return true; }

  if (a == null || b == null) { return false; }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) { return false; }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) { return false; }
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) { return false; }

    for (const key of keysA) {
      if (!keysB.includes(key)) { return false; }
      if (!deepEqual(a[key], b[key])) { return false; }
    }
    return true;
  }

  return false;
}

// ============================================================================
// LAZY LOADING AND CODE SPLITTING
// ============================================================================

/**
 * Enhanced lazy loading with error boundary and loading states
 */
function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    preload?: boolean;
  } = {}
) {
  const LazyComponent = lazy(importFn);

  const {
    fallback: Fallback = () => <div>Loading...</div>,
    errorFallback: ErrorFallback,
    preload = false
  } = options;

  if (preload) {
    // Preload the component
    importFn();
  }

  const WrappedComponent = (props: React.ComponentProps<T>) => {
    if (ErrorFallback) {
      return (
        <ErrorBoundary fallback={ErrorFallback}>
          <Suspense fallback={<Fallback />}>
            <LazyComponent {...props} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Expose preload method
  (WrappedComponent as any).preload = importFn;

  return WrappedComponent;
}

/**
 * Simple error boundary for lazy components
 */
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ComponentType<{ error: Error; retry: () => void }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;
      return <Fallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// ============================================================================
// VIRTUALIZATION HELPERS
// ============================================================================

/**
 * Simple virtualization hook for large lists
 */
function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  scrollTop
}: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
}) {
  return useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        offsetTop: i * itemHeight
      });
    }

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight: itemCount * itemHeight
    };
  }, [itemCount, itemHeight, containerHeight, scrollTop]);
}

/**
 * Virtual list component
 */
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = ''
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const { visibleItems, totalHeight } = useVirtualization({
    itemCount: items.length,
    itemHeight,
    containerHeight: height,
    scrollTop
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, offsetTop }) => {
          const item = items[index];
          if (!item) {
            return null;
          }
          
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: offsetTop,
                height: itemHeight,
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance profiler component
 */
interface ProfilerProps {
  id: string;
  children: React.ReactNode;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}

const Profiler: React.FC<ProfilerProps> = ({
  id,
  children,
  onRender
}) => {
  const handleRender = useCallback((
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (onRender) {
      onRender(id, phase, actualDuration);
    }

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Profiler] ${id} (${phase}):`, {
        actualDuration,
        baseDuration,
        startTime,
        commitTime
      });
    }
  }, [onRender]);

  return (
    <React.Profiler id={id} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
};

// ============================================================================
// OPTIMIZATION HOOKS
// ============================================================================

/**
 * Stable callback hook - prevents unnecessary re-renders
 */
function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const ref = React.useRef<T>(callback);

  React.useLayoutEffect(() => {
    ref.current = callback;
  });

  return React.useCallback(((...args) => ref.current(...args)) as T, []);
}

/**
 * Expensive computation with memoization
 */
function useExpensiveValue<T>(
  computeFn: () => T,
  deps: React.DependencyList
): T {
  return useMemo(() => {
    const start = performance.now();
    const result = computeFn();
    const end = performance.now();

    if (process.env.NODE_ENV === 'development' && end - start > 16) {
      console.warn(`Expensive computation took ${end - start}ms`);
    }

    return result;
  }, deps);
}

/**
 * Debounced expensive operation
 */
function useDebouncedExpensiveOperation<T>(
  operation: () => T,
  delay: number,
  deps: React.DependencyList
): T | null {
  const [result, setResult] = React.useState<T | null>(null);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setResult(operation());
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [...deps, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}

// ============================================================================
// BUNDLE OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Dynamic import with retry logic
 */
async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) { throw error; }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error('Dynamic import failed after retries');
}

/**
 * Preload resources
 */
function preloadResources(resources: string[]): void {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;

    if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
      link.as = 'image';
    }

    document.head.appendChild(link);
  });
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Optimized image component with lazy loading
 */
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  if (error && placeholder) {
    return (
      <img
        src={placeholder}
        alt={alt}
        width={width}
        height={height}
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={lazy ? 'lazy' : 'eager'}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Memoization
  smartMemo,
  shallowEqual,
  deepEqual,

  // Lazy loading
  createLazyComponent,

  // Virtualization
  useVirtualization,
  VirtualList,

  // Performance monitoring
  Profiler,

  // Optimization hooks
  useStableCallback,
  useExpensiveValue,
  useDebouncedExpensiveOperation,

  // Bundle optimization
  dynamicImport,
  preloadResources,

  // Image optimization
  OptimizedImage
};
