import { Directive, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
export abstract class BaseComponent implements OnDestroy {
  protected readonly destroy$ = new Subject<void>();
  protected readonly cdr = inject(ChangeDetectorRef);

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected markForCheck(): void {
    this.cdr.markForCheck();
  }

  protected detectChanges(): void {
    this.cdr.detectChanges();
  }
}