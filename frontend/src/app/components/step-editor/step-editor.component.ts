import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Step, Node } from '../../models/node.model';
import { KeyValueEditorComponent } from '../key-value-editor/key-value-editor.component';
import { NodeSearchModalComponent } from '../node-search-modal/node-search-modal.component';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-step-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    KeyValueEditorComponent,
    NodeSearchModalComponent
  ],
  templateUrl: './step-editor.component.html',
  styleUrl: './step-editor.component.scss'
})
export class StepEditorComponent implements OnInit {
  node: Node | null = null;
  step: Step | null = null;
  allNodes: Node[] = [];

  stepTypes = [
    { value: 'process', label: 'Processo', description: 'Etapa de processamento' },
    { value: 'decision', label: 'Decisão', description: 'Ponto de tomada de decisão (sem conexões obrigatórias)' },
    { value: 'conditional', label: 'Condicional', description: 'Etapa que executa baseada em uma condição' },
    { value: 'parallel', label: 'Paralelo', description: 'Etapa executada em paralelo' }
  ];

  editedStep: Step = {
    id: '',
    type: 'process',
    name: '',
    description: '',
    workflows: [],
    connections: [],
    properties: {},
    // position removed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  isEditMode = false;
  showNodeSearch = false;
  editingConnectionIndex = -1;

  constructor(
    public dialogRef: MatDialogRef<StepEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { node: Node; step: Step | null },
    private stateService: StateService
  ) {
    this.node = data.node;
    this.step = data.step;
  }

  ngOnInit(): void {
    if (this.step) {
      this.editedStep = { ...this.step };
      this.isEditMode = true;
    } else {
      this.resetForm();
    }
    
    // Carregar todos os nós para poder buscar nomes
    this.stateService.nodes$.subscribe(nodes => {
      this.allNodes = nodes;
    });
  }

  ngOnChanges(): void {
    if (this.step) {
      this.editedStep = { ...this.step };
      this.isEditMode = true;
    } else {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.editedStep = {
      id: '',
      type: 'process',
      name: '',
      description: '',
      workflows: this.node?.workflows || ['default'],
      connections: [{ targetNodeId: '' }],
      properties: {},
      // position removed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.isEditMode = false;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.editedStep.name.trim()) {
      alert('Nome da etapa é obrigatório');
      return;
    }

    // Validar se etapa condicional tem decisão associada
    if (this.editedStep.type === 'conditional' && !this.editedStep.decisionStepId) {
      alert('Etapas condicionais devem estar associadas a uma etapa de decisão');
      return;
    }

    this.dialogRef.close({ action: 'save', step: this.editedStep });
  }

  onDelete(): void {
    if (confirm('Tem certeza que deseja excluir esta etapa?')) {
      this.dialogRef.close({ action: 'delete', stepId: this.editedStep.id });
    }
  }

  addConnection(): void {
    this.editedStep.connections.push({
      targetNodeId: ''
    });
    // Abrir automaticamente a busca de nós para a nova conexão
    const newConnectionIndex = this.editedStep.connections.length - 1;
    this.openNodeSearch(newConnectionIndex);
  }

  removeConnection(index: number): void {
    this.editedStep.connections.splice(index, 1);
  }

  getStepTypeInfo(type: string): any {
    return this.stepTypes.find(t => t.value === type) || this.stepTypes[2];
  }

  onStepTypeChange(): void {
    // Reset connections when changing type if needed
    // No longer forcing connections for decision steps
  }

  getAvailableNodes(): Node[] {
    if (!this.node) return [];
    // Return all nodes except the current one
    return this.nodes.filter(n => n.id !== this.node?.id);
  }

  get nodes(): Node[] {
    // Retornar todos os nós exceto o nó atual
    return this.allNodes.filter(n => n.id !== this.node?.id);
  }

  openNodeSearch(index: number): void {
    this.editingConnectionIndex = index;
    this.showNodeSearch = true;
  }

  closeNodeSearch(): void {
    this.showNodeSearch = false;
    this.editingConnectionIndex = -1;
  }

  onNodeSelected(selectedNode: Node): void {
    if (this.editingConnectionIndex >= 0) {
      this.editedStep.connections[this.editingConnectionIndex].targetNodeId = selectedNode.id;
    }
    this.closeNodeSearch();
    // NÃO fechar o modal principal - apenas o modal de seleção
  }

  getNodeName(nodeId: string): string {
    if (!nodeId) return '';
    // Buscar o nó na lista de nós disponíveis
    const targetNode = this.allNodes.find(node => node.id === nodeId);
    return targetNode ? targetNode.name : `Nó ${nodeId.substring(0, 8)}...`;
  }

  getNodeDescription(nodeId: string): string {
    if (!nodeId) return '';
    // Buscar a descrição do nó na lista de nós disponíveis
    const targetNode = this.allNodes.find(node => node.id === nodeId);
    return targetNode ? targetNode.description : '';
  }

  getDecisionSteps(): Step[] {
    if (!this.node) return [];
    // Retornar todas as etapas de decisão do nó atual, exceto a etapa sendo editada
    return this.node.steps.filter(step => 
      step.type === 'decision' && step.id !== this.editedStep.id
    );
  }

  getDecisionStepName(decisionStepId: string): string {
    if (!decisionStepId || !this.node) return '';
    const decisionStep = this.node.steps.find(step => step.id === decisionStepId);
    return decisionStep ? decisionStep.name : 'Decisão não encontrada';
  }
}
