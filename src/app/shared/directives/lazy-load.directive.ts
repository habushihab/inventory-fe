import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Input } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Output() lazyLoad = new EventEmitter<void>();
  @Input() rootMargin = '50px';
  @Input() threshold = 0.1;

  private observer?: IntersectionObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.createObserver();
  }

  ngOnDestroy(): void {
    this.destroyObserver();
  }

  private createObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.lazyLoad.emit();
              this.destroyObserver(); // Load only once
            }
          });
        },
        {
          rootMargin: this.rootMargin,
          threshold: this.threshold
        }
      );

      this.observer.observe(this.elementRef.nativeElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.lazyLoad.emit();
    }
  }

  private destroyObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}