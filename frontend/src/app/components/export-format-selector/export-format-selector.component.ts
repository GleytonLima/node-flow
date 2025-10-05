import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  extension: string;
  tooltip: string;
}

@Component({
  selector: 'app-export-format-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  template: `
    <div class="export-format-selector">
      <div mat-dialog-title class="dialog-header">
        <h2>Escolher Formato de Exportação</h2>
        <p>Selecione o formato desejado para exportar o diagrama</p>
      </div>

      <mat-dialog-content class="dialog-content">
        <div class="formats-grid">
          <mat-card 
            *ngFor="let format of formats" 
            class="format-card"
            [class.selected]="selectedFormat?.id === format.id"
            (click)="selectFormat(format)"
          >
            <mat-card-content>
              <div class="format-content">
                <mat-icon class="format-icon">{{ format.icon }}</mat-icon>
                <div class="format-info">
                  <h3>{{ format.name }}</h3>
                  <p>{{ format.description }}</p>
                  <span class="format-extension">{{ format.extension }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onConfirm()"
          [disabled]="!selectedFormat"
        >
          <mat-icon>download</mat-icon>
          Exportar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .export-format-selector {
      width: 100%;
      max-width: 600px;
    }

    .dialog-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .dialog-header h2 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .dialog-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .dialog-content {
      padding: 0 24px;
    }

    .formats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .format-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .format-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .format-card.selected {
      border-color: #1976d2;
      background-color: #f3f8ff;
    }

    .format-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px;
    }

    .format-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .format-info h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .format-info p {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }

    .format-extension {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .dialog-actions {
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
    }

    @media (max-width: 600px) {
      .formats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ExportFormatSelectorComponent {
  selectedFormat: ExportFormat | null = null;

  formats: ExportFormat[] = [
    {
      id: 'mermaid',
      name: 'Mermaid',
      description: 'Diagrama em formato texto, compatível com GitHub, GitLab e documentação',
      icon: 'account_tree',
      extension: '.mmd',
      tooltip: 'Formato texto para documentação'
    },
    {
      id: 'drawio',
      name: 'Draw.io',
      description: 'Diagrama XML para edição no Draw.io ou app.diagrams.net',
      icon: 'schema',
      extension: '.drawio',
      tooltip: 'Formato XML para edição'
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<ExportFormatSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  selectFormat(format: ExportFormat): void {
    this.selectedFormat = format;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedFormat) {
      this.dialogRef.close(this.selectedFormat);
    }
  }
}
