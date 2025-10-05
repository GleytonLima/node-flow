import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';
import { Node, Workflow } from '../../models/node.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Output() nodeSelected = new EventEmitter<Node>();
  @Output() nodeEdit = new EventEmitter<Node>();
  @Output() nodeConnections = new EventEmitter<Node>();

  nodes: Node[] = [];
  selectedNode: Node | null = null;
  availableWorkflows: Workflow[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private stateService: StateService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.stateService.filteredNodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nodes => this.nodes = nodes || []);

    this.stateService.selectedNode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(node => this.selectedNode = node);

    this.loadWorkflows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectNode(node: Node): void {
    this.stateService.setSelectedNode(node);
    // Não emite nodeSelected para evitar abrir o dialog automaticamente
  }

  editNode(node: Node, event: Event): void {
    event.stopPropagation(); // Previne o clique no card
    this.nodeEdit.emit(node);
  }

  viewNodeConnections(node: Node): void {
    this.nodeConnections.emit(node);
  }



  getNodeTypeIcon(type: string): string {
    switch (type) {
      case 'start': return '▶️';
      case 'end': return '🏁';
      case 'decision': return '❓';
      case 'parallel': return '⚡';
      case 'process': return '⚙️';
      default: return '📄';
    }
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

  getWorkflowName(workflowId: string): string {
    const workflow = this.availableWorkflows.find(w => w.id === workflowId);
    return workflow ? workflow.name : workflowId;
  }
}
