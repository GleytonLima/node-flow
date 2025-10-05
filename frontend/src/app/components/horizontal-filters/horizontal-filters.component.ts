import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { Workflow, StandardProperty } from '../../models/node.model';

@Component({
  selector: 'app-horizontal-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './horizontal-filters.component.html',
  styleUrl: './horizontal-filters.component.scss'
})
export class HorizontalFiltersComponent implements OnInit, OnDestroy {
  @Output() searchResults = new EventEmitter<any[]>();

  // Filtros
  searchQuery = '';
  selectedWorkflow = '';
  selectedStandardProperty = '';
  propertyValue = '';

  // Dados disponíveis
  availableWorkflows: Workflow[] = [];
  availableStandardProperties: StandardProperty[] = [];
  
  // Estado
  isLoading = false;
  hasActiveFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.loadWorkflows();
    this.loadStandardProperties();
    this.checkActiveFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWorkflows(): void {
    this.apiService.getWorkflows()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Se response.data é um objeto com propriedade workflows, extrair o array
            if (response.data && typeof response.data === 'object' && response.data.workflows) {
              this.availableWorkflows = response.data.workflows;
            } else {
              this.availableWorkflows = response.data;
            }
          }
        },
        error: (error) => {
          console.error('Erro ao carregar workflows:', error);
        }
      });
  }

  private loadStandardProperties(): void {
    this.apiService.getStandardProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.availableStandardProperties = response.data;
          }
        },
        error: (error) => {
          console.error('Erro ao carregar propriedades padrão:', error);
        }
      });
  }

  onSearch(): void {
    this.isLoading = true;
    this.checkActiveFilters();

    // Verificar se há pelo menos um critério de busca
    const hasSearchQuery = this.searchQuery.trim().length > 0;
    const hasWorkflowFilter = this.selectedWorkflow && this.selectedWorkflow !== '';
    const hasStandardPropertyFilter = this.selectedStandardProperty && this.selectedStandardProperty !== '';
    const hasPropertyValueFilter = this.propertyValue && this.propertyValue.trim().length > 0;

    if (!hasSearchQuery && !hasWorkflowFilter && !hasStandardPropertyFilter && !hasPropertyValueFilter) {
      // Se não há critérios de busca, limpar resultados
      this.searchResults.emit([]);
      this.stateService.setSearchQuery('');
      this.stateService.setSearchResults([]);
      this.isLoading = false;
      return;
    }

    // Executar busca usando o método de busca existente
    this.apiService.search(this.searchQuery.trim(), {
      workflow: this.selectedWorkflow || undefined,
      standardProperty: this.selectedStandardProperty || undefined,
      propertyValue: this.propertyValue.trim() || undefined,
      includeProperties: true // Sempre incluir busca nas propriedades
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.searchResults.emit(response.data);
            this.stateService.setSearchQuery(this.searchQuery.trim());
            this.stateService.setSearchResults(response.data);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erro na busca:', error);
          this.isLoading = false;
        }
      });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedWorkflow = '';
    this.selectedStandardProperty = '';
    this.propertyValue = '';
    this.hasActiveFilters = false;
    
    // Limpar resultados
    this.searchResults.emit([]);
    this.stateService.setSearchQuery('');
    this.stateService.setSearchResults([]);
  }

  private checkActiveFilters(): void {
    this.hasActiveFilters = !!(
      this.searchQuery.trim() ||
      (this.selectedWorkflow && this.selectedWorkflow !== '') ||
      (this.selectedStandardProperty && this.selectedStandardProperty !== '') ||
      (this.propertyValue && this.propertyValue.trim() !== '')
    );
  }

  onInputChange(): void {
    this.checkActiveFilters();
  }

  getWorkflowName(workflowId: string): string {
    const workflow = this.availableWorkflows.find(w => w.id === workflowId);
    return workflow ? workflow.name : workflowId;
  }

  getStandardPropertyName(propertyName: string): string {
    const property = this.availableStandardProperties.find(p => p.name === propertyName);
    return property ? property.name : propertyName;
  }

  getPropertyTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'text': 'Texto',
      'number': 'Número',
      'boolean': 'Verdadeiro/Falso',
      'date': 'Data',
      'select': 'Seleção'
    };
    return typeMap[type] || type;
  }

  onPropertyChange(): void {
    // Limpar valor quando trocar de propriedade
    this.propertyValue = '';
    this.onInputChange();
  }

  getSelectedPropertyName(): string {
    if (!this.selectedStandardProperty) return '';
    const property = this.availableStandardProperties.find(p => p.name === this.selectedStandardProperty);
    return property ? property.name : this.selectedStandardProperty;
  }

  getPropertyValuePlaceholder(): string {
    if (!this.selectedStandardProperty) return 'Digite o valor';
    const property = this.availableStandardProperties.find(p => p.name === this.selectedStandardProperty);
    if (!property) return 'Digite o valor';
    
    switch (property.type) {
      case 'text': return 'Ex: Alta, Média, Baixa';
      case 'number': return 'Ex: 1, 2, 3';
      case 'boolean': return 'Ex: true, false';
      case 'date': return 'Ex: 2024-01-01';
      case 'select': return property.options && property.options.length > 0 ? `Ex: ${property.options[0]}` : 'Digite o valor';
      default: return 'Digite o valor';
    }
  }
}
