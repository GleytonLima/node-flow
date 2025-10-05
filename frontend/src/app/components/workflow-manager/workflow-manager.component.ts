import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { Workflow } from '../../models/node.model';

@Component({
  selector: 'app-workflow-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './workflow-manager.component.html',
  styleUrl: './workflow-manager.component.scss'
})
export class WorkflowManagerComponent implements OnInit, OnDestroy {
  workflows: Workflow[] = [];
  filteredWorkflows: Workflow[] = [];
  selectedWorkflow: Workflow | null = null;
  showEditor = false;
  isEditing = false;
  editedWorkflow: Partial<Workflow> = {};
  loading = false;
  error: string | null = null;
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private stateService: StateService,
    public dialogRef: MatDialogRef<WorkflowManagerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadWorkflows();
  }

  onSearchChange(): void {
    this.filterWorkflows();
  }

  private filterWorkflows(): void {
    if (!this.searchTerm.trim()) {
      this.filteredWorkflows = [...this.workflows];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredWorkflows = this.workflows.filter(workflow =>
        workflow.name.toLowerCase().includes(term) ||
        workflow.description?.toLowerCase().includes(term) ||
        workflow.id.toLowerCase().includes(term)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkflows(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getWorkflows()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Workflows response:', response);
          if (response.success) {
            // Se response.data é um objeto com propriedade workflows, extrair o array
            if (response.data && typeof response.data === 'object' && response.data.workflows) {
              this.workflows = response.data.workflows;
            } else {
              this.workflows = response.data;
            }
            console.log('Workflows data:', this.workflows);
            this.filterWorkflows();
            this.loading = false;
          } else {
            this.error = 'Erro ao carregar workflows';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Erro ao carregar workflows:', error);
          this.error = 'Erro ao carregar workflows';
          this.loading = false;
        }
      });
  }

  onCreateWorkflow(): void {
    this.isEditing = false;
    this.editedWorkflow = {
      name: '',
      description: ''
    };
    this.showEditor = true;
  }

  onEditWorkflow(workflow: Workflow): void {
    this.isEditing = true;
    this.editedWorkflow = { ...workflow };
    this.showEditor = true;
  }

  onDeleteWorkflow(workflow: Workflow): void {
    if (confirm(`Tem certeza que deseja deletar o workflow "${workflow.name}"?`)) {
      this.loading = true;
      
      this.apiService.deleteWorkflow(workflow.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadWorkflows();
              this.stateService.setSuccess('Workflow deletado com sucesso');
            } else {
              this.error = 'Erro ao deletar workflow';
              this.loading = false;
            }
          },
          error: (error) => {
            console.error('Erro ao deletar workflow:', error);
            this.error = error.error?.error || 'Erro ao deletar workflow';
            this.loading = false;
          }
        });
    }
  }

  onSaveWorkflow(): void {
    if (!this.editedWorkflow.name?.trim()) {
      this.error = 'Nome do workflow é obrigatório';
      return;
    }

    this.loading = true;
    this.error = null;

    const operation = this.isEditing 
      ? this.apiService.updateWorkflow(this.editedWorkflow.id!, this.editedWorkflow)
      : this.apiService.createWorkflow(this.editedWorkflow);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadWorkflows();
            this.closeEditor();
            this.stateService.setSuccess(
              this.isEditing ? 'Workflow atualizado com sucesso' : 'Workflow criado com sucesso'
            );
          } else {
            this.error = 'Erro ao salvar workflow';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Erro ao salvar workflow:', error);
          this.error = error.error?.error || 'Erro ao salvar workflow';
          this.loading = false;
        }
      });
  }

  onCloseEditor(): void {
    this.closeEditor();
  }

  private closeEditor(): void {
    this.showEditor = false;
    this.isEditing = false;
    this.editedWorkflow = {};
    this.error = null;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onViewUsage(workflow: Workflow): void {
    this.apiService.getWorkflowUsage(workflow.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const usage = response.data;
            const message = `Workflow "${workflow.name}" é usado em:\n` +
              `- ${usage.usedInNodes} nó(s)\n` +
              `- ${usage.usedInSteps} etapa(s)`;
            alert(message);
          }
        },
        error: (error) => {
          console.error('Erro ao obter uso do workflow:', error);
          this.stateService.setError('Erro ao obter informações de uso');
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }

  getWorkflowIcon(): string {
    return '🔄';
  }

  trackByWorkflowId(index: number, workflow: Workflow): string {
    return workflow.id;
  }
}
