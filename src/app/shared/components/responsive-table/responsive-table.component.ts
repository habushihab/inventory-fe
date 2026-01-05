import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  mobileHidden?: boolean;
  tabletHidden?: boolean;
  type?: 'text' | 'date' | 'badge' | 'actions';
  format?: (value: any) => string;
}

export interface TableAction {
  label: string;
  icon: string;
  handler: (item: any) => void;
  visible?: (item: any) => boolean;
  class?: string;
}

@Component({
  selector: 'app-responsive-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-hidden bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800">
      <!-- Mobile Card Layout -->
      <div class="block sm:hidden">
        <div *ngFor="let item of data; trackBy: trackByFn" 
             class="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
          <div class="space-y-2">
            <div *ngFor="let col of visibleColumns" class="flex justify-between items-center">
              <span class="text-sm font-medium text-slate-600 dark:text-slate-400">{{ col.label }}:</span>
              <span class="text-sm text-slate-900 dark:text-white text-right">
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'badge'" [ngClass]="getBadgeClass(item[col.key])">
                    {{ col.format ? col.format(item[col.key]) : item[col.key] }}
                  </span>
                  <span *ngSwitchCase="'date'">
                    {{ formatDate(item[col.key]) }}
                  </span>
                  <span *ngSwitchDefault>
                    {{ col.format ? col.format(item[col.key]) : item[col.key] }}
                  </span>
                </ng-container>
              </span>
            </div>
            <div *ngIf="actions.length > 0" class="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button *ngFor="let action of getVisibleActions(item)"
                      (click)="action.handler(item)"
                      [ngClass]="action.class || 'text-primary hover:text-primary/80'"
                      class="inline-flex items-center gap-1 text-xs font-medium transition-colors">
                <span class="material-symbols-outlined text-[16px]">{{ action.icon }}</span>
                {{ action.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table Layout -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th *ngFor="let col of visibleColumns; trackBy: trackByColumn"
                  [ngClass]="getColumnClasses(col)"
                  class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <button *ngIf="col.sortable" 
                        (click)="onSort(col.key)"
                        class="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300">
                  {{ col.label }}
                  <span class="material-symbols-outlined text-[16px]" 
                        [ngClass]="getSortIconClass(col.key)">
                    {{ getSortIcon(col.key) }}
                  </span>
                </button>
                <span *ngIf="!col.sortable">{{ col.label }}</span>
              </th>
              <th *ngIf="actions.length > 0" 
                  class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            <tr *ngFor="let item of data; trackBy: trackByFn; let even = even"
                [ngClass]="even ? 'bg-slate-50/50 dark:bg-slate-800/25' : 'bg-white dark:bg-slate-900'"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td *ngFor="let col of visibleColumns; trackBy: trackByColumn"
                  [ngClass]="getColumnClasses(col)"
                  class="px-6 py-4 whitespace-nowrap text-sm">
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'badge'" 
                        [ngClass]="getBadgeClass(item[col.key])"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ col.format ? col.format(item[col.key]) : item[col.key] }}
                  </span>
                  <span *ngSwitchCase="'date'" class="text-slate-900 dark:text-white">
                    {{ formatDate(item[col.key]) }}
                  </span>
                  <span *ngSwitchDefault class="text-slate-900 dark:text-white">
                    {{ col.format ? col.format(item[col.key]) : item[col.key] }}
                  </span>
                </ng-container>
              </td>
              <td *ngIf="actions.length > 0" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button *ngFor="let action of getVisibleActions(item)"
                          (click)="action.handler(item)"
                          [ngClass]="action.class || 'text-primary hover:text-primary/80'"
                          class="inline-flex items-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">{{ action.icon }}</span>
                    <span class="hidden lg:inline">{{ action.label }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span class="ml-3 text-sm text-slate-500 dark:text-slate-400">Loading...</span>
        </div>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="!isLoading && data.length === 0" class="text-center py-12">
        <div class="text-slate-400 dark:text-slate-500">
          <span class="material-symbols-outlined text-[48px]">{{ emptyIcon }}</span>
        </div>
        <h3 class="mt-2 text-sm font-medium text-slate-900 dark:text-white">{{ emptyTitle }}</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ emptyMessage }}</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() sortKey?: string;
  @Input() sortDirection?: 'asc' | 'desc';
  @Input() isLoading = false;
  @Input() emptyIcon = 'inbox';
  @Input() emptyTitle = 'No data';
  @Input() emptyMessage = 'No items to display';
  @Input() trackByProperty = 'id';

  @Output() sortChange = new EventEmitter<{key: string, direction: 'asc' | 'desc'}>();

  get visibleColumns(): TableColumn[] {
    // On mobile, show only essential columns
    if (window.innerWidth < 640) {
      return this.columns.filter(col => !col.mobileHidden);
    }
    // On tablet, hide tablet-specific columns
    if (window.innerWidth < 1024) {
      return this.columns.filter(col => !col.tabletHidden);
    }
    return this.columns;
  }

  trackByFn: TrackByFunction<any> = (index: number, item: any) => {
    return item[this.trackByProperty] || index;
  };

  trackByColumn: TrackByFunction<TableColumn> = (index: number, column: TableColumn) => {
    return column.key;
  };

  onSort(key: string): void {
    let direction: 'asc' | 'desc' = 'asc';
    if (this.sortKey === key && this.sortDirection === 'asc') {
      direction = 'desc';
    }
    this.sortChange.emit({ key, direction });
  }

  getSortIcon(key: string): string {
    if (this.sortKey !== key) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  getSortIconClass(key: string): string {
    return this.sortKey === key ? 'text-primary' : 'text-slate-400';
  }

  getColumnClasses(col: TableColumn): string {
    const classes = [];
    if (col.width) classes.push(`w-${col.width}`);
    if (col.mobileHidden) classes.push('hidden sm:table-cell');
    if (col.tabletHidden) classes.push('hidden lg:table-cell');
    return classes.join(' ');
  }

  getBadgeClass(value: any): string {
    // Default badge classes - can be overridden via column format
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    if (typeof value === 'boolean') {
      return value 
        ? `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
        : `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    }
    
    return `${baseClasses} bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200`;
  }

  formatDate(date: string | Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  getVisibleActions(item: any): TableAction[] {
    return this.actions.filter(action => 
      !action.visible || action.visible(item)
    );
  }
}