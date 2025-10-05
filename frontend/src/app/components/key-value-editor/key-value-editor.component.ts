import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface KeyValuePair {
  key: string;
  value: any;
}

@Component({
  selector: 'app-key-value-editor',
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
    MatTooltipModule
  ],
  templateUrl: './key-value-editor.component.html',
  styleUrl: './key-value-editor.component.scss'
})
export class KeyValueEditorComponent implements OnInit {
  @Input() properties: { [key: string]: any } = {};
  @Output() propertiesChange = new EventEmitter<{ [key: string]: any }>();

  keyValuePairs: KeyValuePair[] = [];

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    this.keyValuePairs = Object.entries(this.properties).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }));
  }

  addPair(): void {
    this.keyValuePairs.push({ key: '', value: '' });
  }

  removePair(index: number): void {
    this.keyValuePairs.splice(index, 1);
    this.emitProperties();
  }

  updatePair(index: number, field: 'key' | 'value', value: string): void {
    this.keyValuePairs[index][field] = value;
    this.emitProperties();
  }

  onKeyInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updatePair(index, 'key', target.value);
  }

  onValueInput(index: number, event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updatePair(index, 'value', target.value);
  }

  private emitProperties(): void {
    const properties: { [key: string]: any } = {};
    
    this.keyValuePairs.forEach(pair => {
      if (pair.key.trim()) {
        try {
          // Try to parse as JSON first
          properties[pair.key.trim()] = JSON.parse(pair.value);
        } catch {
          // If not valid JSON, store as string
          properties[pair.key.trim()] = pair.value;
        }
      }
    });

    this.propertiesChange.emit(properties);
  }

  getValueType(value: string): string {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed;
    } catch {
      return 'string';
    }
  }

  isJsonValue(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  getValueTypeIcon(value: string): string {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return 'list';
      }
      switch (typeof parsed) {
        case 'boolean':
          return 'check_circle';
        case 'number':
          return 'numbers';
        case 'object':
          return 'data_object';
        default:
          return 'text_fields';
      }
    } catch {
      return 'text_fields';
    }
  }
}
