import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Node, Step, SearchResult } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private nodesSubject = new BehaviorSubject<Node[]>([]);
  private selectedNodeSubject = new BehaviorSubject<Node | null>(null);
  private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private nodeFilterSubject = new BehaviorSubject<string[] | null>(null);

  // Search state management
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchFiltersSubject = new BehaviorSubject<{ workflow?: string; type?: string; includeProperties?: boolean }>({});
  private searchHistorySubject = new BehaviorSubject<string[]>([]);

  // Observables
  nodes$ = this.nodesSubject.asObservable();
  selectedNode$ = this.selectedNodeSubject.asObservable();
  searchResults$ = this.searchResultsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  nodeFilter$ = this.nodeFilterSubject.asObservable();
  searchQuery$ = this.searchQuerySubject.asObservable();
  searchFilters$ = this.searchFiltersSubject.asObservable();
  searchHistory$ = this.searchHistorySubject.asObservable();

  // Observable que combina nós com resultados da busca
  filteredNodes$ = combineLatest([
    this.nodes$,
    this.searchResults$,
    this.searchQuery$
  ]).pipe(
    map(([nodes, searchResults, searchQuery]) => {
      // Se não há query de busca, retorna todos os nós
      if (!searchQuery || searchQuery.trim() === '') {
        return nodes;
      }
      
      // Se há query mas não há resultados, retorna lista vazia
      if (!searchResults || searchResults.length === 0) {
        return [];
      }
      
      // Filtra apenas os nós que estão nos resultados da busca
      const nodeIds = searchResults
        .filter(result => result.type === 'node')
        .map(result => result.id);
      
      return nodes.filter(node => nodeIds.includes(node.id));
    })
  );

  // Getters
  get nodes(): Node[] {
    return this.nodesSubject.value;
  }

  get selectedNode(): Node | null {
    return this.selectedNodeSubject.value;
  }

  get searchResults(): SearchResult[] {
    return this.searchResultsSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get error(): string | null {
    return this.errorSubject.value;
  }

  get nodeFilter(): string[] | null {
    return this.nodeFilterSubject.value;
  }

  // Setters
  setNodes(nodes: Node[]): void {
    this.nodesSubject.next(nodes);
  }

  addNode(node: Node): void {
    const currentNodes = this.nodes;
    this.nodesSubject.next([...currentNodes, node]);
  }

  updateNode(updatedNode: Node): void {
    const currentNodes = this.nodes;
    const index = currentNodes.findIndex(node => node.id === updatedNode.id);
    if (index !== -1) {
      currentNodes[index] = updatedNode;
      this.nodesSubject.next([...currentNodes]);
    }
  }

  removeNode(nodeId: string): void {
    const currentNodes = this.nodes;
    this.nodesSubject.next(currentNodes.filter(node => node.id !== nodeId));
  }

  setSelectedNode(node: Node | null): void {
    this.selectedNodeSubject.next(node);
  }

  setNodeFilter(nodeIds: string[] | null): void {
    this.nodeFilterSubject.next(nodeIds);
  }

  setSearchResults(results: SearchResult[]): void {
    this.searchResultsSubject.next(results);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  setSuccess(message: string): void {
    // Para simplicidade, vamos usar console.log por enquanto
    // Em uma implementação mais robusta, poderíamos ter um Subject para mensagens de sucesso
    console.log('✅', message);
  }

  // Utility methods
  getNodeById(id: string): Node | undefined {
    return this.nodes.find(node => node.id === id);
  }

  getStepById(nodeId: string, stepId: string): Step | undefined {
    const node = this.getNodeById(nodeId);
    return node?.steps.find(step => step.id === stepId);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  clearSearchResults(): void {
    this.searchResultsSubject.next([]);
  }

  // Step management methods
  updateStep(nodeId: string, updatedStep: Step): void {
    const currentNodes = this.nodes;
    const nodeIndex = currentNodes.findIndex(node => node.id === nodeId);
    if (nodeIndex !== -1) {
      const stepIndex = currentNodes[nodeIndex].steps.findIndex(step => step.id === updatedStep.id);
      if (stepIndex !== -1) {
        currentNodes[nodeIndex].steps[stepIndex] = updatedStep;
        this.nodesSubject.next([...currentNodes]);
      }
    }
  }

  removeStep(nodeId: string, stepId: string): void {
    const currentNodes = this.nodes;
    const nodeIndex = currentNodes.findIndex(node => node.id === nodeId);
    if (nodeIndex !== -1) {
      currentNodes[nodeIndex].steps = currentNodes[nodeIndex].steps.filter(step => step.id !== stepId);
      this.nodesSubject.next([...currentNodes]);
    }
  }

  addStep(nodeId: string, newStep: Step): void {
    const currentNodes = this.nodes;
    const nodeIndex = currentNodes.findIndex(node => node.id === nodeId);
    if (nodeIndex !== -1) {
      currentNodes[nodeIndex].steps.push(newStep);
      this.nodesSubject.next([...currentNodes]);
    }
  }

  get searchQuery(): string {
    return this.searchQuerySubject.value;
  }

  get searchFilters(): { workflow?: string; type?: string; includeProperties?: boolean } {
    return this.searchFiltersSubject.value;
  }

  get searchHistory(): string[] {
    return this.searchHistorySubject.value;
  }

  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  setSearchFilters(filters: { workflow?: string; type?: string; includeProperties?: boolean }): void {
    this.searchFiltersSubject.next(filters);
  }

  addToSearchHistory(query: string): void {
    if (query.trim() && !this.searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...this.searchHistory].slice(0, 10); // Manter apenas 10 itens
      this.searchHistorySubject.next(newHistory);
    }
  }

  clearSearchHistory(): void {
    this.searchHistorySubject.next([]);
  }
}
