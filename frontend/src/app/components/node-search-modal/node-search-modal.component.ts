import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Node } from '../../models/node.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-node-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './node-search-modal.component.html',
  styleUrl: './node-search-modal.component.scss'
})
export class NodeSearchModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible = false;
  @Input() excludeNodeId: string | null = null;
  @Input() title = 'Selecionar Nó';
  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<Node>();

  searchQuery = '';
  searchResults: Node[] = [];
  allNodes: Node[] = [];
  isSearching = false;
  hasResults = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAllNodes();
    this.setupSearchSubscription();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible']) {
      // Modal visibility changed
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllNodes(): void {
    this.apiService.getNodes().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.allNodes = response.data.filter((node: Node) => 
            !this.excludeNodeId || node.id !== this.excludeNodeId
          );
          this.performSearch(this.searchQuery);
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar nós:', error);
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

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = this.allNodes;
      this.hasResults = this.searchResults.length > 0;
      return;
    }

    this.isSearching = true;
    const lowerQuery = query.toLowerCase();

    this.searchResults = this.allNodes.filter(node =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.workflows.some(workflow => workflow.toLowerCase().includes(lowerQuery))
    );

    this.hasResults = this.searchResults.length > 0;
    this.isSearching = false;
  }

  selectNode(node: Node): void {
    this.select.emit(node);
    this.close.emit();
  }

  closeModal(): void {
    this.close.emit();
  }

  getNodeTypeIcon(node: Node): string {
    if (node.steps.length === 0) return '📄';
    
    const hasDecision = node.steps.some(s => s.type === 'decision');
    const hasParallel = node.steps.some(s => s.type === 'parallel');
    
    if (hasDecision && hasParallel) return '🔄';
    if (hasDecision) return '🤔';
    if (hasParallel) return '⚡';
    return '⚙️';
  }
}
