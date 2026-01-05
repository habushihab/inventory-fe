import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" (click)="onCancel()">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4" (click)="$event.stopPropagation()">
        <div class="p-6">
          <!-- Icon and Title -->
          <div class="flex items-center gap-4 mb-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-full flex items-center justify-center"
                   [ngClass]="{
                     'bg-red-100 dark:bg-red-900/20': data?.type === 'danger',
                     'bg-yellow-100 dark:bg-yellow-900/20': data?.type === 'warning',
                     'bg-blue-100 dark:bg-blue-900/20': data?.type === 'info' || !data?.type
                   }">
                <span class="material-symbols-outlined text-[24px]"
                      [ngClass]="{
                        'text-red-600 dark:text-red-400': data?.type === 'danger',
                        'text-yellow-600 dark:text-yellow-400': data?.type === 'warning',
                        'text-blue-600 dark:text-blue-400': data?.type === 'info' || !data?.type
                      }">
                  {{ getIcon() }}
                </span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                {{ data?.title }}
              </h3>
            </div>
          </div>
          
          <!-- Message -->
          <div class="mb-6">
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {{ data?.message }}
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3">
            <button 
              type="button"
              (click)="onCancel()"
              class="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">
              {{ data?.cancelText || 'Cancel' }}
            </button>
            <button 
              type="button"
              (click)="onConfirm()"
              class="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700 text-white': data?.type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700 text-white': data?.type === 'warning',
                'bg-primary hover:bg-primary/90 text-white': data?.type === 'info' || !data?.type
              }">
              {{ data?.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmationModalComponent {
  @Input() show: boolean = false;
  @Input() data?: ConfirmationData;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  getIcon(): string {
    switch (this.data?.type) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'error';
      case 'info':
      default:
        return 'help';
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}