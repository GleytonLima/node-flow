import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { VisCanvasComponent } from './components/vis-canvas/vis-canvas.component';
import { AppBarComponent } from './components/app-bar/app-bar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NodeViewerComponent } from './components/node-viewer/node-viewer.component';
import { NodeEditorComponent } from './components/node-editor/node-editor.component';
import { StepEditorComponent } from './components/step-editor/step-editor.component';
import { StepsManagerComponent } from './components/steps-manager/steps-manager.component';
import { AdvancedSearchComponent } from './components/advanced-search/advanced-search.component';
import { HorizontalFiltersComponent } from './components/horizontal-filters/horizontal-filters.component';
import { WorkflowManagerComponent } from './components/workflow-manager/workflow-manager.component';
import { StandardPropertyManagerComponent } from './components/standard-property-manager/standard-property-manager.component';
import { NodeDeletionConfirmationComponent } from './components/node-deletion-confirmation/node-deletion-confirmation.component';
import { Node, Step } from './models/node.model';
import { StateService } from './services/state.service';
import { ApiService } from './services/api.service';
import { ThemeService } from './services/theme.service';
import { MermaidExportService } from './services/mermaid-export.service';
import { DrawioExportService } from './services/drawio-export.service';
import { ExportFormatSelectorComponent, ExportFormat } from './components/export-format-selector/export-format-selector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, VisCanvasComponent, AppBarComponent, SidebarComponent, AdvancedSearchComponent, HorizontalFiltersComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Resources Manager';

  // Estado dos modais - agora usando MatDialog
  selectedNode: Node | null = null;
  selectedStep: Step | null = null;
  stepsManagerNode: Node | null = null; // Nó específico para o gerenciador de etapas
  
  // Variáveis para modais que ainda usam o sistema antigo
  showAdvancedSearch = false;

  constructor(
    private stateService: StateService,
    private apiService: ApiService,
    private themeService: ThemeService,
    private dialog: MatDialog,
    private mermaidExportService: MermaidExportService,
    private drawioExportService: DrawioExportService
  ) {}

  ngOnInit(): void {
    // Initialize theme service to watch system theme changes
    this.themeService.watchSystemTheme();
  }


  loadNodes(): void {
    this.apiService.getNodes().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.stateService.setNodes(response.data);
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar nós:', error);
      }
    });
  }

  onNodeSelected(node: Node): void {
    console.log('Nó selecionado:', node);
    this.selectedNode = node;
    this.stepsManagerNode = null; // Limpar nó do gerenciador quando seleciona novo nó
    
    // Abrir Node Viewer usando MatDialog
    const dialogRef = this.dialog.open(NodeViewerComponent, {
      data: { node: node },
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Node Viewer fechado:', result);
      if (result) {
        switch (result.action) {
          case 'edit':
            this.onNodeViewerEdit(result.node);
            break;
          case 'stepClick':
            this.onNodeViewerStepClick({ node: result.node, step: result.step });
            break;
          case 'nodeSelected':
            this.onNodeSelected(result.node);
            break;
          case 'manageSteps':
            this.onNodeViewerManageSteps(result.node);
            break;
        }
      }
    });
  }

  onCreateNode(): void {
    this.selectedNode = null; // Novo nó
    this.openNodeEditor();
  }

  // Node Viewer methods
  onNodeViewerClose(): void {
    // Não é mais necessário - o dialog se fecha automaticamente
  }

  onNodeViewerEdit(node: Node): void {
    this.selectedNode = node;
    this.openNodeEditor();
  }

  private openNodeEditor(): void {
    const dialogRef = this.dialog.open(NodeEditorComponent, {
      data: { node: this.selectedNode },
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Node Editor fechado:', result);
      if (result) {
        switch (result.action) {
          case 'save':
            this.onNodeEditorSave(result.node);
            break;
          case 'delete':
            this.onNodeEditorDelete(result.nodeId);
            break;
          case 'deleteRequest':
            this.onNodeDeleteRequest(result.nodeId);
            break;
          case 'viewSteps':
            this.onNodeEditorViewSteps(result.node);
            break;
        }
      }
    });
  }

  onNodeViewerStepClick(data: { node: Node; step: Step }): void {
    // Pode implementar navegação para o nó de destino se necessário
    console.log('Etapa clicada:', data.step.name, 'do nó:', data.node.name);
  }

  onNodeViewerManageSteps(node: Node): void {
    this.stepsManagerNode = node;
    this.openStepsManager(() => {
      // Reabrir o NodeViewer após fechar o StepsManager
      this.onNodeSelected(node);
    });
  }

  private openStepsManager(callback?: () => void): void {
    const dialogRef = this.dialog.open(StepsManagerComponent, {
      data: { node: this.stepsManagerNode },
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Steps Manager fechado:', result);
      if (result) {
        switch (result.action) {
          case 'editStep':
            this.onStepsManagerEditStep({ node: result.node, step: result.step });
            break;
          case 'createStep':
            this.onStepsManagerCreateStep(result.node);
            break;
          case 'deleteStep':
            this.onStepsManagerDeleteStep({ node: result.node, stepId: result.stepId });
            break;
        }
      }
      
      // Executar callback se fornecido
      if (callback) {
        callback();
      }
    });
  }

  onNodeEditorClose(): void {
    // Não é mais necessário - o dialog se fecha automaticamente
  }

  onNodeEditorSave(node: Node): void {
    this.apiService.updateNode(node.id, node).subscribe({
      next: (response) => {
        if (response.success) {
          this.stateService.updateNode(response.data);
          console.log('Nó salvo com sucesso');
        }
      },
      error: (error) => {
        console.error('Erro ao salvar nó:', error);
        this.stateService.setError('Erro ao salvar nó');
      }
    });
  }

  onNodeEditorDelete(nodeId: string): void {
    this.apiService.deleteNode(nodeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.stateService.removeNode(nodeId);
          console.log('Nó excluído com sucesso');
        }
      },
      error: (error) => {
        console.error('Erro ao excluir nó:', error);
        this.stateService.setError('Erro ao excluir nó');
      }
    });
  }

  onStepEditorClose(): void {
    console.log('Fechando editor de etapa. StepsManagerNode:', this.stepsManagerNode?.name);
    this.selectedStep = null;
    
    // Se temos um nó do gerenciador, voltar para o gerenciador de etapas
    if (this.stepsManagerNode) {
      console.log('Voltando para gerenciador de etapas do nó:', this.stepsManagerNode.name);
      this.openStepsManager();
    } else {
      console.log('Nenhum nó do gerenciador encontrado, fechando tudo');
    }
  }

  onStepEditorSave(step: Step): void {
    if (this.selectedNode) {
      // Se é uma nova etapa (sem ID), usar addStepToNode
      if (!step.id || step.id === '') {
        this.apiService.addStepToNode(this.selectedNode.id, step).subscribe({
          next: (response: any) => {
                 if (response.success) {
                   this.stateService.addStep(this.selectedNode!.id, response.data);
                   this.selectedStep = null;
                   
                   // Voltar para o gerenciador de etapas
                   if (this.stepsManagerNode) {
                     this.openStepsManager();
                   }
                 }
          },
          error: (error: any) => {
            console.error('Erro ao criar etapa:', error);
            this.stateService.setError('Erro ao criar etapa');
          }
        });
      } else {
        // Se é uma etapa existente, usar updateStepInNode
        this.apiService.updateStepInNode(this.selectedNode.id, step.id, step).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.stateService.updateStep(this.selectedNode!.id, response.data);
              this.selectedStep = null;
              
              // Voltar para o gerenciador de etapas
              if (this.stepsManagerNode) {
                this.openStepsManager();
              }
            }
          },
          error: (error: any) => {
            console.error('Erro ao salvar etapa:', error);
            this.stateService.setError('Erro ao salvar etapa');
          }
        });
      }
    }
  }

  onStepEditorDelete(stepId: string): void {
    if (this.selectedNode) {
      this.apiService.deleteStepFromNode(this.selectedNode.id, stepId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.stateService.removeStep(this.selectedNode!.id, stepId);
            this.selectedStep = null;
            
            // Voltar para o gerenciador de etapas
            if (this.stepsManagerNode) {
              this.openStepsManager();
            }
          }
        },
        error: (error: any) => {
          console.error('Erro ao excluir etapa:', error);
          this.stateService.setError('Erro ao excluir etapa');
        }
      });
    }
  }

  // Steps Manager methods
  onNodeEditorViewSteps(node: Node): void {
    console.log('Abrindo gerenciador de etapas para nó:', node.name);
    this.stepsManagerNode = node; // Guardar o nó para o gerenciador
    this.openStepsManager();
  }


  onStepsManagerClose(): void {
    this.stepsManagerNode = null;
  }

  onStepsManagerEditStep(data: { node: Node; step: Step }): void {
    this.selectedNode = data.node;
    this.selectedStep = data.step;
    this.openStepEditor();
  }

  onStepsManagerCreateStep(node: Node): void {
    this.selectedNode = node;
    this.selectedStep = null; // Nova etapa
    this.openStepEditor();
  }

  private openStepEditor(): void {
    const dialogRef = this.dialog.open(StepEditorComponent, {
      data: { node: this.selectedNode, step: this.selectedStep },
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Step Editor fechado:', result);
      if (result) {
        switch (result.action) {
          case 'save':
            this.onStepEditorSave(result.step);
            break;
          case 'delete':
            this.onStepEditorDelete(result.stepId);
            break;
        }
      }
    });
  }

  onStepsManagerDeleteStep(data: { node: Node; stepId: string }): void {
    this.apiService.deleteStepFromNode(data.node.id, data.stepId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stateService.removeStep(data.node.id, data.stepId);
        }
      },
      error: (error: any) => {
        console.error('Erro ao excluir etapa:', error);
        this.stateService.setError('Erro ao excluir etapa');
      }
    });
  }

  // Advanced Search methods

  onAdvancedSearchClose(): void {
    this.showAdvancedSearch = false;
  }

  // Node actions from sidebar
  onNodeEdit(node: Node): void {
    this.selectedNode = node;
    this.openNodeEditor();
  }

  onNodeConnections(node: Node): void {
    console.log('Visualizando conexões do nó:', node.name);
    this.apiService.getNodeConnections(node.id, 10).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('Cadeia de conexões encontrada:', response.data);
          
          // Extrair IDs dos nós conectados
          const connectedNodeIds = new Set<string>();
          connectedNodeIds.add(node.id); // Incluir o nó inicial
          
          response.data.forEach((connection: any) => {
            connectedNodeIds.add(connection.fromNode.id);
            connectedNodeIds.add(connection.toNode.id);
          });
          
          // Filtrar nós para mostrar apenas os conectados
          this.stateService.setNodeFilter(Array.from(connectedNodeIds));
          this.stateService.setSelectedNode(node);
        }
      },
      error: (error: any) => {
        console.error('Erro ao buscar conexões:', error);
        this.stateService.setError('Erro ao buscar conexões do nó');
      }
    });
  }

  // Workflow management methods
  onAppBarWorkflowsClick(): void {
    const dialogRef = this.dialog.open(WorkflowManagerComponent, {
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Workflow Manager fechado:', result);
      if (result) {
        // Handle any result from workflow manager if needed
        console.log('Resultado do Workflow Manager:', result);
      }
    });
  }

  onStandardPropertiesClick(): void {
    const dialogRef = this.dialog.open(StandardPropertyManagerComponent, {
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Standard Property Manager fechado:', result);
      if (result) {
        // Handle any result from standard property manager if needed
        console.log('Resultado do Standard Property Manager:', result);
      }
    });
  }

  // Export methods
  onExportClick(): void {
    this.openExportFormatSelector();
  }

  private openExportFormatSelector(): void {
    const dialogRef = this.dialog.open(ExportFormatSelectorComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((selectedFormat: ExportFormat) => {
      if (selectedFormat) {
        this.exportToFormat(selectedFormat);
      }
    });
  }

  private exportToFormat(format: ExportFormat): void {
    // Carregar todos os nós para exportação
    this.apiService.getNodes().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const nodes = response.data;
          const timestamp = new Date().toISOString().split('T')[0];
          
          if (format.id === 'mermaid') {
            const mermaid = this.mermaidExportService.exportToMermaid(nodes);
            const filename = `resources-manager-diagram-${timestamp}.mmd`;
            this.mermaidExportService.downloadMermaid(mermaid, filename);
            console.log('Exportação para Mermaid concluída:', filename);
          } else if (format.id === 'drawio') {
            console.log('🚀 Iniciando exportação Draw.io...');
            console.log('📊 Nós para exportar:', nodes.length);
            try {
              const xml = this.drawioExportService.exportToDrawioXml(nodes);
              const filename = `resources-manager-export-${timestamp}.drawio`;
              this.drawioExportService.downloadXml(xml, filename);
              console.log('✅ Exportação para Draw.io concluída:', filename);
            } catch (error) {
              console.error('❌ Erro na exportação Draw.io:', error);
              this.stateService.setError('Erro ao exportar para Draw.io: ' + error);
            }
          }
        }
      },
      error: (error: any) => {
        console.error('Erro ao exportar:', error);
        this.stateService.setError(`Erro ao exportar dados para ${format.name}`);
      }
    });
  }

  // Node deletion methods
  onNodeDeleteRequest(nodeId: string): void {
    const dialogRef = this.dialog.open(NodeDeletionConfirmationComponent, {
      data: { nodeId: nodeId },
      width: '600px',
      maxWidth: '90vw',
      height: '80vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onNodeDeletionConfirm({ ...result, nodeId: nodeId });
      }
    });
  }


  onNodeDeletionConfirm(options: { force: boolean; cascade: boolean; nodeId: string }): void {
    const nodeId = options.nodeId;
    if (!nodeId) return;

    this.apiService.deleteNode(nodeId, options)
      .subscribe({
        next: (response) => {
          if (response.success) {
                  // Recarregar nós após exclusão
                  this.loadNodes();
            // Dialog já foi fechado automaticamente
            
            // Mostrar mensagem de sucesso
            console.log('Nó deletado com sucesso:', response.message);
          }
        },
        error: (error) => {
          console.error('Erro ao deletar nó:', error);
          // Aqui você pode mostrar uma mensagem de erro para o usuário
        }
      });
  }

  onSearchResults(results: any[]): void {
    // Os resultados da busca são automaticamente gerenciados pelo StateService
    // Este método pode ser usado para lógica adicional se necessário
    console.log('Resultados da busca recebidos:', results);
  }
}
