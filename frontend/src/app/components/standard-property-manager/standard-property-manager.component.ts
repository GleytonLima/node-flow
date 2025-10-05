import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../services/api.service';
import { StandardProperty } from '../../models/node.model';
import { StandardPropertyEditorComponent, StandardPropertyEditorData } from '../standard-property-editor/standard-property-editor.component';
import { StandardPropertyDeletionConfirmationComponent, StandardPropertyDeletionData } from '../standard-property-deletion-confirmation/standard-property-deletion-confirmation.component';

@Component({
  selector: 'app-standard-property-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './standard-property-manager.component.html',
  styleUrl: './standard-property-manager.component.scss'
})
export class StandardPropertyManagerComponent implements OnInit, OnDestroy {
  properties: StandardProperty[] = [];
  filteredProperties: StandardProperty[] = [];
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<StandardPropertyManagerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  onSearchChange(): void {
    this.filterProperties();
  }

  private filterProperties(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProperties = [...this.properties];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredProperties = this.properties.filter(property =>
        property.name.toLowerCase().includes(term) ||
        property.description?.toLowerCase().includes(term) ||
        property.type.toLowerCase().includes(term)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.error = null;
    
    this.apiService.getStandardProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.properties = response.data;
            this.filterProperties();
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erro ao carregar propriedades padrão';
          this.isLoading = false;
          console.error('Erro ao carregar propriedades:', error);
        }
      });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(StandardPropertyEditorComponent, {
      data: { isEditing: false } as StandardPropertyEditorData,
      width: '600px',
      maxWidth: '90vw',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save') {
        this.createProperty(result.property);
      }
    });
  }

  openEditModal(property: StandardProperty): void {
    const dialogRef = this.dialog.open(StandardPropertyEditorComponent, {
      data: { property: property, isEditing: true } as StandardPropertyEditorData,
      width: '600px',
      maxWidth: '90vw',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save') {
        this.updateProperty(result.property);
      }
    });
  }

  openDeleteModal(property: StandardProperty): void {
    const dialogRef = this.dialog.open(StandardPropertyDeletionConfirmationComponent, {
      data: { property: property } as StandardPropertyDeletionData,
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'delete') {
        this.deleteProperty(result.property);
      }
    });
  }

  createProperty(propertyData: Partial<StandardProperty>): void {
    if (!propertyData.name?.trim()) return;

    this.isLoading = true;
    this.error = null;

    const newProperty: StandardProperty = {
      id: '',
      name: propertyData.name.trim(),
      description: propertyData.description?.trim() || '',
      type: propertyData.type || 'text',
      options: propertyData.type === 'select' ? (propertyData.options || []) : [],
      required: propertyData.required || false,
      defaultValue: propertyData.defaultValue?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.apiService.createStandardProperty(newProperty)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProperties();
          } else {
            this.error = response.message || 'Erro ao criar propriedade';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erro ao criar propriedade';
          this.isLoading = false;
          console.error('Erro ao criar propriedade:', error);
        }
      });
  }

  updateProperty(propertyData: Partial<StandardProperty>): void {
    if (!propertyData.id || !propertyData.name?.trim()) return;

    this.isLoading = true;
    this.error = null;

    const updatedProperty: StandardProperty = {
      ...propertyData as StandardProperty,
      name: propertyData.name.trim(),
      description: propertyData.description?.trim() || '',
      type: propertyData.type || 'text',
      options: propertyData.type === 'select' ? (propertyData.options || []) : [],
      required: propertyData.required || false,
      defaultValue: propertyData.defaultValue?.trim() || '',
      updatedAt: new Date().toISOString()
    };

    this.apiService.updateStandardProperty(propertyData.id, updatedProperty)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProperties();
          } else {
            this.error = response.message || 'Erro ao atualizar propriedade';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erro ao atualizar propriedade';
          this.isLoading = false;
          console.error('Erro ao atualizar propriedade:', error);
        }
      });
  }

  deleteProperty(property: StandardProperty): void {
    if (!property.id) return;

    this.isLoading = true;
    this.error = null;

    this.apiService.deleteStandardProperty(property.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProperties();
          } else {
            this.error = response.message || 'Erro ao excluir propriedade';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erro ao excluir propriedade';
          this.isLoading = false;
          console.error('Erro ao excluir propriedade:', error);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'text': 'Texto',
      'number': 'Número',
      'boolean': 'Verdadeiro/Falso',
      'date': 'Data',
      'select': 'Seleção'
    };
    return typeMap[type] || type;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }
}


