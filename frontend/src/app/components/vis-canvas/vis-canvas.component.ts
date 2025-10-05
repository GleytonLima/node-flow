import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Node, Step } from '../../models/node.model';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';

// Import vis.js
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

@Component({
  selector: 'app-vis-canvas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './vis-canvas.component.html',
  styleUrl: './vis-canvas.component.scss'
})
export class VisCanvasComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('networkContainer', { static: true }) networkContainer!: ElementRef<HTMLDivElement>;
  @Output() nodeSelected = new EventEmitter<Node>();
  @Output() stepSelected = new EventEmitter<{ node: Node; step: Step }>();
  @Output() createNode = new EventEmitter<void>();

  private network: any = null;
  private nodes: any = null;
  private edges: any = null;
  private destroy$ = new Subject<void>();
  appNodes: Node[] = [];
  loading = false;
  selectedNodeInfo: Node | null = null;

  constructor(
    private stateService: StateService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadNodes();
    this.subscribeToState();
  }

  ngAfterViewInit(): void {
    this.initVisNetwork();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.network) {
      this.network.destroy();
    }
  }

  private loadNodes(): void {
    this.stateService.setLoading(true);
    this.apiService.getNodes().subscribe({
      next: (response) => {
        if (response.success) {
          this.stateService.setNodes(response.data);
        }
        this.stateService.setLoading(false);
      },
      error: (error) => {
        console.error('Erro ao carregar nós:', error);
        this.stateService.setError('Erro ao carregar nós');
        this.stateService.setLoading(false);
      }
    });
  }

  private subscribeToState(): void {
    this.stateService.filteredNodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nodes => {
        this.appNodes = nodes;
        this.updateNetwork();
      });

    this.stateService.nodeFilter$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filter => {
        this.updateNetwork();
      });

    this.stateService.selectedNode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedNode => {
        this.highlightSelectedNode(selectedNode);
      });

    this.stateService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  private initVisNetwork(): void {
    if (!this.networkContainer) return;

    // Usar DataSet do vis-data
    this.nodes = new DataSet();
    this.edges = new DataSet();

    const data = {
      nodes: this.nodes,
      edges: this.edges
    };

    const options = {
      nodes: {
        shape: 'box',
        size: 35, // Aumentado de 25 para 35
        font: {
          size: 12,
          color: '#333333'
        },
        borderWidth: 2,
        color: {
          background: '#ffffff',
          border: '#4A90E2',
          highlight: {
            background: '#f0f8ff',
            border: '#357ABD'
          },
          hover: {
            background: '#f8f9fa',
            border: '#357ABD'
          }
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 3,
          x: 1,
          y: 1
        }
      },
      edges: {
        width: 2,
        color: {
          color: '#4A90E2',
          highlight: '#357ABD',
          hover: '#357ABD'
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1,
            type: 'arrow'
          }
        },
        smooth: false,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 3,
          x: 1,
          y: 1
        }
      },
      physics: {
        enabled: false
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectConnectedEdges: false,
        hover: true,
        hoverConnectedEdges: true,
        keyboard: {
          enabled: true,
          speed: { x: 10, y: 10, zoom: 0.02 },
          bindToWindow: true
        }
      },
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'UD', // Up-Down (top to bottom)
          sortMethod: 'directed',
          levelSeparation: 150,
          nodeSpacing: 250,
          treeSpacing: 400,
          blockShifting: true,
          edgeMinimization: false,
          parentCentralization: false
        }
      }
    };

    this.network = new Network(this.networkContainer.nativeElement, data, options);

    // Eventos
    this.network.on('click', (params: any) => {
      console.log('Vis.js click event:', params);
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = this.appNodes.find(n => n.id === nodeId);
        console.log('Node found:', node);
        if (node) {
          console.log('Emitting nodeSelected event:', node);
          this.nodeSelected.emit(node);
        }
      }
    });

    this.network.on('oncontext', (params: any) => {
      params.event.preventDefault();
    });

    this.updateNetwork();
  }

  private updateNetwork(): void {
    if (!this.network) return;

    // Limpar dados existentes
    this.nodes.clear();
    this.edges.clear();

    // Aplicar filtro se existir
    const nodeFilter = this.stateService.nodeFilter;
    const filteredNodes = nodeFilter 
      ? this.appNodes.filter(node => nodeFilter.includes(node.id))
      : this.appNodes;

    // Adicionar nós
    const visNodes: any[] = filteredNodes.map(node => ({
      id: node.id,
      label: node.name, // Apenas o nome do nó
      title: `${node.name}\n${node.description}\nWorkflows: ${node.workflows.join(', ')}\nEtapas: ${node.steps.length}`,
      color: {
        background: '#ffffff',
        border: '#4A90E2',
        highlight: {
          background: '#f0f8ff',
          border: '#357ABD'
        }
      }
    }));

    this.nodes.add(visNodes);

    // Adicionar arestas (conexões) com suporte a triângulos de decisão
    const visEdges: any[] = [];
    const decisionTriangles: any[] = [];
    const decisionMap = new Map<string, { nodeId: string, decisionStepId: string, decisionName: string, conditionals: any[] }>();
    
    // Primeira passada: Agrupar etapas condicionais por decisão
    filteredNodes.forEach(node => {
      node.steps.forEach(step => {
        if (step.type === 'conditional' && step.decisionStepId) {
          const decisionStep = node.steps.find(s => s.id === step.decisionStepId);
          const decisionName = decisionStep ? decisionStep.name : 'Decisão';
          const decisionKey = `${node.id}-${step.decisionStepId}`;
          
          if (!decisionMap.has(decisionKey)) {
            decisionMap.set(decisionKey, {
              nodeId: node.id,
              decisionStepId: step.decisionStepId,
              decisionName: decisionName,
              conditionals: []
            });
          }
          
          // Adicionar etapa condicional ao grupo
          decisionMap.get(decisionKey)!.conditionals.push({
            step: step,
            connections: step.connections.filter(conn => conn.targetNodeId) // Apenas conexões com destino
          });
        }
      });
    });
    
    // Segunda passada: Criar triângulos e conexões
    filteredNodes.forEach(node => {
      node.steps.forEach(step => {
        step.connections.forEach(connection => {
          const targetNode = filteredNodes.find(n => n.id === connection.targetNodeId);
          if (targetNode) {
            if (step.type === 'conditional' && step.decisionStepId) {
              // Esta conexão será processada no grupo de decisão
              // Não fazer nada aqui, será processado abaixo
            } else {
              // Conexão normal (não condicional)
              visEdges.push({
                id: `${node.id}-${connection.targetNodeId}-${step.id}`,
                from: node.id,
                to: connection.targetNodeId,
                label: step.name, // Nome da etapa na aresta
                title: `Conexão de ${node.name} para ${targetNode.name}\nEtapa: ${step.name} (${step.type})`,
                color: this.getEdgeColor(step.type),
                dashes: step.type === 'decision',
                width: step.type === 'decision' ? 3 : 2,
                font: {
                  size: 10,
                  color: '#333333',
                  background: 'rgba(255, 255, 255, 0.8)',
                  strokeWidth: 1,
                  strokeColor: '#ffffff'
                }
              });
            }
          }
        });
      });
    });
    
    // Terceira passada: Criar triângulos de decisão e suas conexões
    decisionMap.forEach((decisionGroup, decisionKey) => {
      if (decisionGroup.conditionals.length > 0) {
        const triangleId = `decision-${decisionKey}`;
        // Criar um único triângulo para a decisão
        decisionTriangles.push({
          id: triangleId,
          label: decisionGroup.decisionName,
          shape: 'diamond',
          size: 25,
          color: {
            background: '#ffc107',
            border: '#e0a800',
            highlight: {
              background: '#ffcd39',
              border: '#d39e00'
            }
          },
          font: {
            size: 10,
            color: '#000000'
          }
        });
        
        // Aresta do nó para o triângulo
        visEdges.push({
          id: `${decisionGroup.nodeId}-${triangleId}`,
          from: decisionGroup.nodeId,
          to: triangleId,
          label: '',
          title: `Decisão: ${decisionGroup.decisionName}`,
          color: this.getEdgeColor('decision'),
          width: 2,
          font: {
            size: 10,
            color: '#333333',
            background: 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 1,
            strokeColor: '#ffffff'
          }
        });
        
        // Arestas do triângulo para os destinos das etapas condicionais
        decisionGroup.conditionals.forEach((conditional, index) => {
          conditional.connections.forEach((connection: any) => {
            const targetNode = filteredNodes.find(n => n.id === connection.targetNodeId);
            if (targetNode) {
              visEdges.push({
                id: `${triangleId}-${connection.targetNodeId}-${conditional.step.id}`,
                from: triangleId,
                to: connection.targetNodeId,
                label: conditional.step.name,
                title: `Etapa Condicional: ${conditional.step.name}\nDecisão: ${decisionGroup.decisionName}\nDestino: ${targetNode.name}`,
                color: this.getEdgeColor('conditional'),
                width: 2,
                font: {
                  size: 10,
                  color: '#333333',
                  background: 'rgba(255, 255, 255, 0.8)',
                  strokeWidth: 1,
                  strokeColor: '#ffffff'
                }
              });
            }
          });
        });
      }
    });
    
    // Adicionar triângulos de decisão aos nós ANTES das arestas
    if (decisionTriangles.length > 0) {
      this.nodes.add(decisionTriangles);
    }

    this.edges.add(visEdges);
  }

  private getEdgeColor(stepType: string): string {
    switch (stepType) {
      case 'decision': return '#ffc107';
      case 'conditional': return '#ffc107';
      case 'parallel': return '#6f42c1';
      case 'process': return '#4A90E2';
      default: return '#6c757d';
    }
  }

  private highlightSelectedNode(selectedNode: Node | null): void {
    if (!this.network || !this.nodes) return;

    // Primeiro, remover destaque de todos os nós
    const allNodes = this.nodes.get();
    allNodes.forEach((node: any) => {
      this.nodes.update({
        id: node.id,
        color: {
          background: '#ffffff',
          border: '#4A90E2',
          highlight: {
            background: '#f0f8ff',
            border: '#357ABD'
          }
        }
      });
    });

    // Se há um nó selecionado, destacá-lo
    if (selectedNode) {
      this.nodes.update({
        id: selectedNode.id,
        color: {
          background: '#e3f2fd',
          border: '#1976d2',
          highlight: {
            background: '#bbdefb',
            border: '#0d47a1'
          }
        }
      });

      // Centralizar o nó selecionado
      this.network.focus(selectedNode.id, {
        scale: 1.2,
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  }

  // Métodos públicos para controle do diagrama
  zoomToFit(): void {
    if (this.network) {
      this.network.fit();
    }
  }

  reapplyLayout(): void {
    if (this.network) {
      // Aplica layout hierárquico otimizado
      this.network.setOptions({
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 150,
            nodeSpacing: 250,
            treeSpacing: 400,
            blockShifting: true,
            edgeMinimization: false,
            parentCentralization: false
          }
        }
      });
      
      // Ajusta a visualização após layout
      setTimeout(() => {
        this.network.fit();
      }, 200);
    }
  }

  clearFilter(): void {
    this.stateService.setNodeFilter(null);
    this.stateService.setSelectedNode(null);
  }

  hasActiveFilter(): boolean {
    return this.stateService.nodeFilter !== null;
  }

  createNewNode(): void {
    this.createNode.emit();
  }

  // Novos métodos para FABs

}
