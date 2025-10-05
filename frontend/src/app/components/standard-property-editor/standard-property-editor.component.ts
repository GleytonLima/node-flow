import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StandardProperty } from '../../models/node.model';
import { ApiService } from '../../services/api.service';

export interface StandardPropertyEditorData {
  property?: StandardProperty;
  isEditing: boolean;
}

@Component({
  selector: 'app-standard-property-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './standard-property-editor.component.html',
  styleUrl: './standard-property-editor.component.scss'
})
export class StandardPropertyEditorComponent implements OnInit, OnDestroy {
  @Input() properties: { [key: string]: any } = {};
  @Output() propertiesChange = new EventEmitter<{ [key: string]: any }>();

  availableStandardProperties: StandardProperty[] = [];
  loadingStandardProperties = false;
  selectedPropertyToAdd: string = '';

  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStandardProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStandardProperties(): void {
    this.loadingStandardProperties = true;
    this.apiService.getStandardProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.availableStandardProperties = response.data;
          }
          this.loadingStandardProperties = false;
        },
        error: (error) => {
          console.error('Erro ao carregar propriedades padrão:', error);
          this.loadingStandardProperties = false;
        }
      });
  }

  getAvailableProperties(): StandardProperty[] {
    return this.availableStandardProperties.filter(prop => 
      !this.properties.hasOwnProperty(prop.name)
    );
  }

  onAddProperty(): void {
    if (this.selectedPropertyToAdd) {
      const selectedProp = this.availableStandardProperties.find(prop => prop.name === this.selectedPropertyToAdd);
      if (selectedProp) {
        let initialValue: any;
        if (selectedProp.defaultValue) {
          initialValue = selectedProp.defaultValue;
        } else {
          switch (selectedProp.type) {
            case 'text':
              initialValue = '';
              break;
            case 'number':
              initialValue = 0;
              break;
            case 'boolean':
              initialValue = false;
              break;
            case 'date':
              initialValue = '';
              break;
            case 'select':
              initialValue = selectedProp.options && selectedProp.options.length > 0 ? selectedProp.options[0] : '';
              break;
            default:
              initialValue = '';
          }
        }
        
        const newProperties = { ...this.properties };
        newProperties[selectedProp.name] = initialValue;
        this.propertiesChange.emit(newProperties);
        this.selectedPropertyToAdd = '';
      }
    }
  }

  onRemoveProperty(propertyName: string): void {
    const newProperties = { ...this.properties };
    delete newProperties[propertyName];
    this.propertiesChange.emit(newProperties);
  }

  onPropertyValueChange(propertyName: string, value: any): void {
    const newProperties = { ...this.properties };
    newProperties[propertyName] = value;
    this.propertiesChange.emit(newProperties);
  }

  getPropertyDefinition(propertyName: string): StandardProperty | undefined {
    return this.availableStandardProperties.find(prop => prop.name === propertyName);
  }

  getPropertyTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'text': 'Texto',
      'number': 'Número',
      'boolean': 'Verdadeiro/Falso',
      'date': 'Data',
      'select': 'Seleção'
    };
    return typeMap[type] || type;
  }

  // Método para acessar Object.keys no template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // Métodos para lidar com eventos de input
  onTextInput(propertyName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onPropertyValueChange(propertyName, target.value);
  }

  onNumberInput(propertyName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onPropertyValueChange(propertyName, +target.value);
  }

  onDateInput(propertyName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onPropertyValueChange(propertyName, target.value);
  }
}