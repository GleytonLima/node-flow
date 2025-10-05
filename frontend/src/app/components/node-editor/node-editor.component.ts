import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Node, Workflow, StandardProperty } from '../../models/node.model';
import { KeyValueEditorComponent } from '../key-value-editor/key-value-editor.component';
import { StandardPropertyEditorComponent } from '../standard-property-editor/standard-property-editor.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-node-editor',
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
    MatProgressSpinnerModule,
    MatTooltipModule,
    KeyValueEditorComponent,
    StandardPropertyEditorComponent
  ],
  templateUrl: './node-editor.component.html',
  styleUrl: './node-editor.component.scss'
})
export class NodeEditorComponent implements OnInit, OnDestroy {
  node: Node | null = null;

  editedNode: Node | null = null;
  isEditing = false;
  availableWorkflows: Workflow[] = [];
  loadingWorkflows = false;

  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<NodeEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { node: Node | null },
    private apiService: ApiService
  ) {
    this.node = data.node;
  }

  ngOnInit(): void {
    this.resetForm();
    this.loadWorkflows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.resetForm();
  }

  private resetForm(): void {
    if (this.node) {
      this.editedNode = {
        ...this.node,
        properties: {
          standardProps: { ...this.node.properties.standardProps },
          customProps: { ...this.node.properties.customProps }
        }
      };
      this.isEditing = true;
    } else {
      this.editedNode = {
        id: '',
        name: '',
        description: '',
        workflows: ['default'],
        properties: {
          standardProps: {},
          customProps: {}
        },
        steps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.isEditing = false;
    }
  }

  onSave(): void {
    if (this.editedNode && this.editedNode.name.trim()) {
      this.editedNode.updatedAt = new Date().toISOString();
      this.dialogRef.close({ action: 'save', node: this.editedNode });
    }
  }

  onDelete(): void {
    if (this.editedNode && this.editedNode.id) {
      this.dialogRef.close({ action: 'deleteRequest', nodeId: this.editedNode.id });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onViewSteps(): void {
    if (this.editedNode) {
      this.dialogRef.close({ action: 'viewSteps', node: this.editedNode });
    }
  }

  onStandardPropsChange(properties: { [key: string]: any }): void {
    if (this.editedNode) {
      this.editedNode.properties.standardProps = properties;
    }
  }

  onCustomPropsChange(properties: { [key: string]: any }): void {
    if (this.editedNode) {
      this.editedNode.properties.customProps = properties;
    }
  }


  private loadWorkflows(): void {
    this.loadingWorkflows = true;
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
          this.loadingWorkflows = false;
        },
        error: (error) => {
          console.error('Erro ao carregar workflows:', error);
          this.loadingWorkflows = false;
        }
      });
  }


  addWorkflow(): void {
    if (this.editedNode && this.editedNode.workflows.length < 10) {
      // Adicionar o primeiro workflow disponível como padrão
      const defaultWorkflow = this.availableWorkflows.length > 0 ? this.availableWorkflows[0].id : 'default';
      this.editedNode.workflows.push(defaultWorkflow);
    }
  }

  removeWorkflow(index: number): void {
    if (this.editedNode && this.editedNode.workflows.length > 1) {
      this.editedNode.workflows.splice(index, 1);
    }
  }

  getWorkflowName(workflowId: string): string {
    const workflow = this.availableWorkflows.find(w => w.id === workflowId);
    return workflow ? workflow.name : workflowId;
  }

  getWorkflowDescription(workflowId: string): string {
    const workflow = this.availableWorkflows.find(w => w.id === workflowId);
    return workflow ? workflow.description : '';
  }

  trackByIndex(index: number): number {
    return index;
  }

}
