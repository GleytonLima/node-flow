import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Node, Step } from '../../models/node.model';

@Component({
  selector: 'app-steps-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './steps-manager.component.html',
  styleUrl: './steps-manager.component.scss'
})
export class StepsManagerComponent implements OnInit {
  node: Node | null = null;

  constructor(
    public dialogRef: MatDialogRef<StepsManagerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { node: Node }
  ) {
    this.node = data.node;
  }

  stepTypes = [
    { value: 'process', label: 'Processo', icon: 'settings', color: 'primary' },
    { value: 'decision', label: 'Decisão', icon: 'help_outline', color: 'accent' },
    { value: 'conditional', label: 'Condicional', icon: 'rule', color: 'warn' },
    { value: 'parallel', label: 'Paralelo', icon: 'sync', color: 'primary' }
  ];

  ngOnInit(): void {}

  getStepTypeInfo(type: string) {
    return this.stepTypes.find(t => t.value === type) || this.stepTypes[2];
  }

  getStepTypeColor(type: string): string {
    return this.getStepTypeInfo(type).color;
  }

  onEditStep(step: Step): void {
    if (this.node) {
      this.dialogRef.close({ action: 'editStep', node: this.node, step });
    }
  }

  onCreateStep(): void {
    if (this.node) {
      this.dialogRef.close({ action: 'createStep', node: this.node });
    }
  }

  onDeleteStep(step: Step): void {
    if (this.node && confirm(`Tem certeza que deseja excluir a etapa "${step.name}"?`)) {
      this.dialogRef.close({ action: 'deleteStep', node: this.node, stepId: step.id });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getConnectionCount(step: Step): number {
    return step.connections.length;
  }

  getConnectionTargets(step: Step): string {
    return step.connections.map(conn => conn.targetNodeId).join(', ');
  }

  trackByStepId(index: number, step: Step): string {
    return step.id;
  }

  get hasSteps(): boolean {
    return !!(this.node?.steps && this.node.steps.length > 0);
  }

  get steps(): Step[] {
    return this.node?.steps || [];
  }
}
