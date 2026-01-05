import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  
  /**
   * Creates a debounced search observable
   * @param debounceMs Debounce time in milliseconds (default: 300)
   * @returns Observable for debounced search
   */
  createDebouncedSearch(debounceMs: number = 300): { 
    search$: Observable<string>, 
    next: (value: string) => void 
  } {
    const searchSubject = new Subject<string>();
    const search$ = searchSubject.asObservable().pipe(
      debounceTime(debounceMs),
      distinctUntilChanged()
    );
    
    return {
      search$,
      next: (value: string) => searchSubject.next(value)
    };
  }

  /**
   * Track by function for ngFor loops
   * @param key Property name to track by
   * @returns TrackBy function
   */
  trackBy<T>(key: keyof T) {
    return (index: number, item: T): any => item[key] ?? index;
  }

  /**
   * Generic track by ID function
   */
  trackById = (index: number, item: any): any => item.id ?? index;

  /**
   * Track by index function
   */
  trackByIndex = (index: number): number => index;

  /**
   * Throttle function for frequent operations
   * @param func Function to throttle
   * @param limit Time limit in milliseconds
   * @returns Throttled function
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  /**
   * Lazy loading intersection observer
   * @param callback Function to call when element intersects
   * @param options Intersection observer options
   * @returns Observer instance
   */
  createLazyLoadObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = { rootMargin: '50px' }
  ): IntersectionObserver {
    return new IntersectionObserver(callback, options);
  }

  /**
   * Virtual scrolling helper - calculates visible items
   * @param scrollTop Current scroll position
   * @param itemHeight Height of each item
   * @param containerHeight Height of the container
   * @param totalItems Total number of items
   * @param buffer Number of items to render outside viewport
   * @returns Visible range and offset
   */
  calculateVisibleRange(
    scrollTop: number,
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    buffer: number = 5
  ): { start: number; end: number; offsetY: number } {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(totalItems, start + visibleItems + buffer * 2);
    const offsetY = start * itemHeight;

    return { start, end, offsetY };
  }

  /**
   * Memoization helper for expensive calculations
   * @param fn Function to memoize
   * @param getKey Function to generate cache key
   * @returns Memoized function
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    getKey?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map();
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = getKey ? getKey(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Check if code is running in browser environment
   */
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return this.isBrowser() && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get optimal image loading strategy based on network
   */
  getImageLoadingStrategy(): 'eager' | 'lazy' {
    if (!this.isBrowser()) return 'lazy';
    
    const connection = (navigator as any).connection;
    if (connection) {
      const slowConnections = ['slow-2g', '2g', '3g'];
      return slowConnections.includes(connection.effectiveType) ? 'lazy' : 'eager';
    }
    
    return 'lazy';
  }
}