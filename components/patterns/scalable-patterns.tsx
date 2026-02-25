/**
 * @filimport {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  // forwardRef, // Commented out unused import
  ComponentProps,
  ReactNodealable React Component Patterns
 *
 * High-performance, reusable component patterns that follow enterprise
 * architecture principles. Includes composition patterns, render props,
 * and higher-order components for maximum flexibility.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  ComponentType,
  HTMLAttributes,
  forwardRef as _forwardRef,
  RefObject,
} from 'react';

import { LoadingState } from '@/lib/utils/types-utils';
import { cn } from '@/lib/utils/utils';

// ============================================================================
// PROVIDER PATTERN COMPONENTS
// ============================================================================

/**
 * Generic data provider context for any resource
 */
interface DataProviderContextValue<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateData: (data: T) => void;
}

function createDataProvider<T>() {
  const DataContext = createContext<DataProviderContextValue<T> | undefined>(undefined);

  const DataProvider: React.FC<{
    children: ReactNode;
    fetchData: () => Promise<T>;
    initialData?: T;
  }> = ({ children, fetchData, initialData = null }) => {
    const [state, setState] = useState<LoadingState<T>>({
      data: initialData,
      isLoading: false,
      error: null,
    });

    const refetch = useCallback(async () => {
      setState((prev: LoadingState<T>) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await fetchData();
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        setState((prev: LoadingState<T>) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }, [fetchData]);

    const updateData = useCallback((data: T) => {
      setState((prev: LoadingState<T>) => ({ ...prev, data }));
    }, []);

    const value = useMemo(
      () => ({
        data: state.data,
        isLoading: state.isLoading,
        error: state.error,
        refetch,
        updateData,
      }),
      [state, refetch, updateData]
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
  };

  const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
      throw new Error('useData must be used within a DataProvider');
    }
    return context;
  };

  return { DataProvider, useData };
}

// ============================================================================
// COMPOUND COMPONENT PATTERNS
// ============================================================================

/**
 * Modal compound component with flexible composition
 */
interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const Modal = {
  Root: ({ children, isOpen, onClose }: { children: ReactNode; isOpen: boolean; onClose: () => void }) => {
    const value = useMemo(() => ({ isOpen, onClose }), [isOpen, onClose]);

    if (!isOpen) {
      return null;
    }

    return (
      <ModalContext.Provider value={value}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 max-h-[90vh] max-w-lg overflow-auto">{children}</div>
        </div>
      </ModalContext.Provider>
    );
  },

  Content: ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    return (
      <div className={cn('glass-card rounded-2xl p-6 shadow-2xl', className)} {...props}>
        {children}
      </div>
    );
  },

  Header: ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    return (
      <div className={cn('mb-4 border-b border-white/10 pb-4', className)} {...props}>
        {children}
      </div>
    );
  },

  Title: ({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
    return (
      <h2 className={cn('text-xl font-semibold text-white', className)} {...props}>
        {children}
      </h2>
    );
  },

  Body: ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    return (
      <div className={cn('text-gray-100', className)} {...props}>
        {children}
      </div>
    );
  },

  Footer: ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    return (
      <div className={cn('mt-6 flex justify-end gap-3 border-t border-white/10 pt-4', className)} {...props}>
        {children}
      </div>
    );
  },

  CloseButton: ({
    children = 'Close',
    className,
    ...props
  }: HTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) => {
    const modal = useContext(ModalContext);
    if (!modal) {
      throw new Error('Modal.CloseButton must be used within Modal.Root');
    }

    return (
      <button
        className={cn('rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20', className)}
        onClick={modal.onClose}
        {...props}
      >
        {children}
      </button>
    );
  },
};

// ============================================================================
// RENDER PROP PATTERNS
// ============================================================================

/**
 * Generic async operation component with render props
 */
interface AsyncOperationProps<T> {
  operation: () => Promise<T>;
  children: (state: LoadingState<T> & { execute: () => Promise<void> }) => ReactNode;
  immediate?: boolean;
}

function AsyncOperation<T>({ operation, children, immediate = false }: AsyncOperationProps<T>) {
  const [state, setState] = useState<LoadingState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev: LoadingState<T>) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await operation();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState((prev: LoadingState<T>) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [operation]);

  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return <>{children({ ...state, execute })}</>;
}

/**
 * Intersection observer render prop component
 */
interface IntersectionObserverProps {
  children: (props: { ref: RefObject<HTMLDivElement>; isIntersecting: boolean }) => ReactNode;
  threshold?: number;
  rootMargin?: string;
}

const IntersectionObserver: React.FC<IntersectionObserverProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '0px',
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin]);

  return <>{children({ ref, isIntersecting })}</>;
};

// ============================================================================
// HIGHER-ORDER COMPONENTS
// ============================================================================

/**
 * HOC for adding loading states to any component
 */
interface WithLoadingProps {
  isLoading?: boolean;
  loadingComponent?: ReactNode;
}

function withLoading<P extends object>(WrappedComponent: ComponentType<P>): ComponentType<P & WithLoadingProps> {
  const WithLoadingComponent = (props: P & WithLoadingProps) => {
    const { isLoading = false, loadingComponent = <div>Loading...</div>, ...restProps } = props;

    if (isLoading) {
      return <>{loadingComponent}</>;
    }

    return <WrappedComponent {...(restProps as P)} />;
  };

  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithLoadingComponent;
}

/**
 * HOC for error boundaries
 */
interface WithErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  ErrorComponent?: ComponentType<{ error: Error; reset: () => void }>
): ComponentType<P> {
  class WithErrorBoundaryComponent extends React.Component<P, WithErrorBoundaryState> {
    static displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): WithErrorBoundaryState {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    reset = () => {
      this.setState({ hasError: false, error: null });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        if (ErrorComponent) {
          return <ErrorComponent error={this.state.error} reset={this.reset} />;
        }

        return (
          <div className="glass-card rounded-lg p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-red-400">Something went wrong</h2>
            <p className="mb-4 text-gray-300">{this.state.error.message}</p>
            <button
              onClick={this.reset}
              className="rounded-lg bg-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500/30"
            >
              Try Again
            </button>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  }

  return WithErrorBoundaryComponent;
}

/**
 * HOC for conditional rendering based on authentication
 */
interface WithAuthProps {
  fallback?: ReactNode;
}

function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  checkAuth: () => boolean = () => false
): ComponentType<P & WithAuthProps> {
  const WithAuthComponent = (props: P & WithAuthProps) => {
    const { fallback = <div>Access denied</div>, ...restProps } = props;

    if (!checkAuth()) {
      return <>{fallback}</>;
    }

    return <WrappedComponent {...(restProps as P)} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthComponent;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Lazy loading wrapper component
 */
interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}

const LazyLoad: React.FC<LazyLoadProps> = ({ children, fallback = null, threshold = 0.1, rootMargin = '100px' }) => {
  return (
    <IntersectionObserver threshold={threshold} rootMargin={rootMargin}>
      {({ ref, isIntersecting }) => <div ref={ref}>{isIntersecting ? children : fallback}</div>}
    </IntersectionObserver>
  );
};

/**
 * Fade in animation wrapper
 */
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  threshold?: number;
}

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, duration = 300, threshold = 0.1 }) => {
  return (
    <IntersectionObserver threshold={threshold}>
      {({ ref, isIntersecting }) => (
        <div
          ref={ref}
          className={`transition-all ${isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{
            transitionDelay: `${delay}ms`,
            transitionDuration: `${duration}ms`,
          }}
        >
          {children}
        </div>
      )}
    </IntersectionObserver>
  );
};

/**
 * Conditional wrapper component
 */
interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: ReactNode) => ReactNode;
  children: ReactNode;
}

const ConditionalWrapper: React.FC<ConditionalWrapperProps> = ({ condition, wrapper, children }) => {
  return condition ? <>{wrapper(children)}</> : <>{children}</>;
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Factory functions
  createDataProvider,

  // Compound components
  Modal,

  // Render prop components
  AsyncOperation,
  IntersectionObserver,

  // Higher-order components
  withLoading,
  withErrorBoundary,
  withAuth,

  // Utility components
  LazyLoad,
  FadeIn,
  ConditionalWrapper,

  // Types
  type DataProviderContextValue,
  type ModalContextValue,
  type AsyncOperationProps,
  type IntersectionObserverProps,
  type WithLoadingProps,
  type WithAuthProps,
  type LazyLoadProps,
  type FadeInProps,
  type ConditionalWrapperProps,
};
