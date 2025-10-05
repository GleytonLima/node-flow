import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { Node } from '../../models/node.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  @Output() searchResults = new EventEmitter<Node[]>();
  @Output() searchCleared = new EventEmitter<void>();

  searchQuery = '';
  selectedWorkflow = '';
  workflows: string[] = [];
  isSearching = false;
  showFilters = false;
  results: Node[] = [];
  hasResults = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.loadWorkflows();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWorkflows(): void {
    this.apiService.getWorkflows().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.workflows = response.data.workflows.map((w: any) => w.id);
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar workflows:', error);
      }
    });
  }

  private setupSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performSearch(query);
      });
  }

  onSearchInput(): void {
    this.searchSubject$.next(this.searchQuery);
  }

  onWorkflowChange(): void {
    this.performSearch(this.searchQuery);
  }

  private performSearch(query: string): void {
    if (!query.trim() && !this.selectedWorkflow) {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.hasResults = false;

    this.apiService.searchNodes(query, this.selectedWorkflow || undefined).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.results = response.data;
          this.hasResults = this.results.length > 0;
          this.searchResults.emit(this.results);
        }
        this.isSearching = false;
      },
      error: (error: any) => {
        console.error('Erro na busca:', error);
        this.isSearching = false;
        this.hasResults = false;
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedWorkflow = '';
    this.results = [];
    this.hasResults = false;
    this.isSearching = false;
    this.searchCleared.emit();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  selectNode(node: Node): void {
    this.stateService.setSelectedNode(node);
  }

  getWorkflowDisplayName(workflowId: string): string {
    // Para simplificar, retornamos o ID. Em uma implementação completa,
    // buscaríamos o nome do workflow
    return workflowId;
  }
}