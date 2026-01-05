import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3 sm:px-6" 
         *ngIf="totalItems > 0">
      <!-- Mobile pagination -->
      <div class="flex flex-1 justify-between sm:hidden">
        <button
          (click)="onPageChange(currentPage - 1)"
          [disabled]="currentPage <= 1"
          class="relative inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
          Previous
        </button>
        <span class="text-sm text-slate-700 dark:text-slate-300 flex items-center">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          (click)="onPageChange(currentPage + 1)"
          [disabled]="currentPage >= totalPages"
          class="relative ml-3 inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
          Next
        </button>
      </div>
      
      <!-- Desktop pagination -->
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-slate-700 dark:text-slate-300">
            Showing
            <span class="font-medium">{{ startItem }}</span>
            to
            <span class="font-medium">{{ endItem }}</span>
            of
            <span class="font-medium">{{ totalItems }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            <!-- Previous button -->
            <button
              (click)="onPageChange(currentPage - 1)"
              [disabled]="currentPage <= 1"
              class="relative inline-flex items-center rounded-l-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="sr-only">Previous</span>
              <span class="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            
            <!-- Page numbers -->
            <ng-container *ngFor="let page of visiblePages; trackBy: trackByPage">
              <button
                *ngIf="page !== '...'"
                (click)="onPageChange(+page)"
                [class]="getPageButtonClass(+page)"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0">
                {{ page }}
              </button>
              <span
                *ngIf="page === '...'"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:outline-offset-0">
                ...
              </span>
            </ng-container>
            
            <!-- Next button -->
            <button
              (click)="onPageChange(currentPage + 1)"
              [disabled]="currentPage >= totalPages"
              class="relative inline-flex items-center rounded-r-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="sr-only">Next</span>
              <span class="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 20;
  @Input() maxVisiblePages = 7;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): (number | string)[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const maxVisible = this.maxVisiblePages;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const sidePages = Math.floor(maxVisible / 2);

    if (current <= sidePages + 1) {
      // Show first pages + ellipsis + last page
      for (let i = 1; i <= Math.min(maxVisible - 2, totalPages); i++) {
        pages.push(i);
      }
      if (totalPages > maxVisible - 1) {
        pages.push('...');
        pages.push(totalPages);
      }
    } else if (current >= totalPages - sidePages) {
      // Show first page + ellipsis + last pages
      pages.push(1);
      pages.push('...');
      for (let i = Math.max(totalPages - (maxVisible - 3), 1); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page + ellipsis + middle pages + ellipsis + last page
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  getPageButtonClass(page: number): string {
    const baseClasses = 'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset focus:z-20 focus:outline-offset-0';
    
    if (page === this.currentPage) {
      return `${baseClasses} z-10 bg-primary text-white ring-primary`;
    }
    
    return `${baseClasses} text-slate-900 dark:text-white ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700`;
  }

  trackByPage = (index: number, page: number | string): number | string => page;
}