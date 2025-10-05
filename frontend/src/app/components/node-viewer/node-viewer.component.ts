import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Node, Step, Workflow } from '../../models/node.model';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-node-viewer',
  standalone: true,
  imports: [
    CommonModule,
    KeyValuePipe,
    MatDialogModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  templateUrl: './node-viewer.component.html',
  styleUrl: './node-viewer.component.scss'
})
export class NodeViewerComponent implements OnInit, OnDestroy {
  node: Node | null = null;
  allNodes: Node[] = [];
  availableWorkflows: Workflow[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private stateService: StateService,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<NodeViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { node: Node }
  ) {
    this.node = data.node;
  }

  ngOnInit(): void {
    // Carregar todos os nós para poder buscar nomes
    this.stateService.nodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nodes => {
        this.allNodes = nodes;
      });

    // Carregar workflows disponíveis
    this.loadWorkflows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    if (this.node) {
      this.dialogRef.close({ action: 'edit', node: this.node });
    }
  }

  onStepClick(step: Step): void {
    if (this.node) {
      this.dialogRef.close({ action: 'stepClick', node: this.node, step });
    }
  }

  getStepTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'process': 'Processo',
      'decision': 'Decisão',
      'conditional': 'Condicional',
      'parallel': 'Paralelo'
    };
    return labels[type] || type;
  }

  getStepTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'process': 'settings',
      'decision': 'help_outline',
      'conditional': 'rule',
      'parallel': 'sync'
    };
    return icons[type] || 'description';
  }

  getConnectionTargets(step: Step): string[] {
    return step.connections.map(conn => {
      // Aqui você pode buscar o nome do nó de destino se necessário
      // Por enquanto, retornamos o ID
      return `Nó: ${conn.targetNodeId}`;
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }

  hasStandardProperties(): boolean {
    return !!(this.node?.properties?.standardProps && 
           Object.keys(this.node.properties.standardProps).length > 0);
  }

  hasCustomProperties(): boolean {
    return !!(this.node?.properties?.customProps && 
           Object.keys(this.node.properties.customProps).length > 0);
  }

  getNodeName(nodeId: string): string {
    const targetNode = this.allNodes.find(node => node.id === nodeId);
    return targetNode ? targetNode.name : `Nó: ${nodeId}`;
  }

  onConnectionClick(targetNodeId: string): void {
    const targetNode = this.allNodes.find(node => node.id === targetNodeId);
    if (targetNode) {
      // Selecionar o nó no menu lateral
      this.stateService.setSelectedNode(targetNode);
      // Fechar o viewer e retornar o nó selecionado
      this.dialogRef.close({ action: 'nodeSelected', node: targetNode });
    }
  }

  onManageSteps(): void {
    if (this.node) {
      this.dialogRef.close({ action: 'manageSteps', node: this.node });
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

  hasValidConnections(connections: any[]): boolean {
    if (!connections || connections.length === 0) return false;
    return connections.some(conn => conn.targetNodeId && conn.targetNodeId.trim() !== '');
  }

  getDecisionStepName(decisionStepId: string): string {
    if (!decisionStepId || !this.node) return 'Decisão não encontrada';
    const decisionStep = this.node.steps.find(step => step.id === decisionStepId);
    return decisionStep ? decisionStep.name : 'Decisão não encontrada';
  }
}
