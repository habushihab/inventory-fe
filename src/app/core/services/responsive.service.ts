import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  private readonly breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1280
  };

  private breakpointSubject = new BehaviorSubject<BreakpointState>(this.getBreakpointState());

  constructor() {
    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(150),
          map(() => this.getBreakpointState()),
          distinctUntilChanged((prev, curr) => prev.currentBreakpoint === curr.currentBreakpoint)
        )
        .subscribe(state => this.breakpointSubject.next(state));
    }
  }

  get breakpoint$(): Observable<BreakpointState> {
    return this.breakpointSubject.asObservable();
  }

  get currentBreakpoint(): BreakpointState {
    return this.breakpointSubject.value;
  }

  private getBreakpointState(): BreakpointState {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    
    const isMobile = width < this.breakpoints.mobile;
    const isTablet = width >= this.breakpoints.mobile && width < this.breakpoints.desktop;
    const isDesktop = width >= this.breakpoints.desktop && width < this.breakpoints.largeDesktop;
    const isLargeDesktop = width >= this.breakpoints.largeDesktop;

    let currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
    if (isMobile) currentBreakpoint = 'mobile';
    else if (isTablet) currentBreakpoint = 'tablet';
    else if (isDesktop) currentBreakpoint = 'desktop';
    else currentBreakpoint = 'large-desktop';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      currentBreakpoint
    };
  }

  isMobile(): boolean {
    return this.currentBreakpoint.isMobile;
  }

  isTablet(): boolean {
    return this.currentBreakpoint.isTablet;
  }

  isDesktop(): boolean {
    return this.currentBreakpoint.isDesktop;
  }

  isLargeDesktop(): boolean {
    return this.currentBreakpoint.isLargeDesktop;
  }
}