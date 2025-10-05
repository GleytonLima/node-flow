import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { SearchResult } from '../../models/node.model';

@Component({
  selector: 'app-advanced-search',
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './advanced-search.component.html',
  styleUrl: './advanced-search.component.scss'
})
export class AdvancedSearchComponent implements OnInit, OnDestroy {
  searchQuery = '';
  selectedWorkflow = '';
  selectedType = '';
  includeProperties = true;
  
  availableWorkflows: string[] = [];
  availableTypes: string[] = [];
  searchSuggestions: string[] = [];
  searchResults: SearchResult[] = [];
  isLoading = false;
  showSuggestions = false;
  showResults = false;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Carregar workflows disponíveis
    this.apiService.getAvailableWorkflows().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableWorkflows = response.data;
        }
      },
      error: (error) => console.error('Erro ao carregar workflows:', error)
    });

    // Carregar tipos de etapa disponíveis
    this.apiService.getAvailableStepTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableTypes = response.data;
        }
      },
      error: (error) => console.error('Erro ao carregar tipos:', error)
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.length >= 2) {
        this.getSuggestions(query);
      } else {
        this.searchSuggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      this.performSearch();
    }
  }

  private performSearch(): void {
    this.isLoading = true;
    this.showResults = true;
    this.showSuggestions = false;

    const options = {
      workflow: this.selectedWorkflow || undefined,
      type: this.selectedType || undefined,
      includeProperties: this.includeProperties
    };

    this.apiService.search(this.searchQuery, options).subscribe({
      next: (response) => {
        if (response.success) {
          this.searchResults = response.data;
          this.stateService.setSearchQuery(this.searchQuery);
          this.stateService.setSearchResults(response.data);
          this.stateService.addToSearchHistory(this.searchQuery);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro na busca:', error);
        this.isLoading = false;
        this.stateService.setError('Erro ao realizar busca');
      }
    });
  }

  private getSuggestions(query: string): void {
    this.apiService.getSearchSuggestions(query).subscribe({
      next: (response) => {
        if (response.success) {
          this.searchSuggestions = response.data;
          this.showSuggestions = this.searchSuggestions.length > 0;
        }
      },
      error: (error) => console.error('Erro ao obter sugestões:', error)
    });
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSuggestions = false;
    this.performSearch();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedWorkflow = '';
    this.selectedType = '';
    this.includeProperties = true;
    this.searchResults = [];
    this.searchSuggestions = [];
    this.showResults = false;
    this.showSuggestions = false;
    this.stateService.setSearchQuery('');
    this.stateService.setSearchResults([]);
  }

  clearFilters(): void {
    this.selectedWorkflow = '';
    this.selectedType = '';
    this.includeProperties = true;
  }

  getStepTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'process': 'Processo',
      'decision': 'Decisão',
      'parallel': 'Paralelo'
    };
    return labels[type] || type;
  }

  getStepTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'process': '⚙️',
      'decision': '🤔',
      'parallel': '⚡'
    };
    return icons[type] || '📄';
  }
}

