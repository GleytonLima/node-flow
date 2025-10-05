import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

export interface NodeDeletionInfo {
  node: {
    id: string;
    name: string;
    description: string;
  };
  dependencies: Array<{
    nodeId: string;
    nodeName: string;
    stepId: string;
    stepName: string;
    connection: any;
  }>;
  canDelete: boolean;
  message: string;
}

@Component({
  selector: 'app-node-deletion-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './node-deletion-confirmation.component.html',
  styleUrl: './node-deletion-confirmation.component.scss'
})
export class NodeDeletionConfirmationComponent implements OnInit {
  nodeId: string;
  deletionInfo: NodeDeletionInfo | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<NodeDeletionConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { nodeId: string },
    private apiService: ApiService
  ) {
    this.nodeId = data.nodeId;
  }

  ngOnInit(): void {
    this.loadDeletionInfo();
  }

  loadDeletionInfo(): void {
    if (!this.nodeId) return;

    this.isLoading = true;
    this.error = null;

    this.apiService.getNodeDeletionInfo(this.nodeId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.deletionInfo = response.data;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erro ao carregar informações de exclusão';
          this.isLoading = false;
          console.error('Erro ao carregar informações:', error);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onConfirmDelete(): void {
    if (!this.deletionInfo) return;

    // Se não há dependências, pode deletar normalmente
    if (this.deletionInfo.dependencies.length === 0) {
      this.dialogRef.close({ force: false, cascade: true });
      return;
    }

    // Se há dependências, usar cascade=true para remover automaticamente
    this.dialogRef.close({ force: true, cascade: true });
  }

  onForceDelete(): void {
    this.dialogRef.close({ force: true, cascade: true });
  }

  getDependencyDescription(dependency: any): string {
    return `${dependency.nodeName} → ${dependency.stepName}`;
  }
}


