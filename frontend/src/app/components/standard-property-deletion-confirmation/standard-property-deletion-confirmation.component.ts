import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StandardProperty } from '../../models/node.model';

export interface StandardPropertyDeletionData {
  property: StandardProperty;
}

@Component({
  selector: 'app-standard-property-deletion-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './standard-property-deletion-confirmation.component.html',
  styleUrl: './standard-property-deletion-confirmation.component.scss'
})
export class StandardPropertyDeletionConfirmationComponent {
  property: StandardProperty;

  constructor(
    public dialogRef: MatDialogRef<StandardPropertyDeletionConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StandardPropertyDeletionData
  ) {
    this.property = data.property;
  }

  onConfirm(): void {
    this.dialogRef.close({ action: 'delete', property: this.property });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
