import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node, Step } from '../../models/node.model';

interface ConnectionLine {
  from: { x: number; y: number };
  to: { x: number; y: number };
  condition?: string;
  type: string;
}

@Component({
  selector: 'app-connection-lines',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-lines.component.html',
  styleUrl: './connection-lines.component.scss'
})
export class ConnectionLinesComponent implements OnChanges, AfterViewInit {
  @Input() nodes: Node[] = [];
  @Input() zoom = 1;
  @Input() panX = 0;
  @Input() panY = 0;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGElement>;

  connectionLines: ConnectionLine[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['zoom'] || changes['panX'] || changes['panY']) {
      this.updateConnectionLines();
    }
  }

  ngAfterViewInit(): void {
    this.updateConnectionLines();
  }

  private updateConnectionLines(): void {
    this.connectionLines = [];
    
    this.nodes.forEach(node => {
      node.steps.forEach(step => {
        step.connections.forEach(connection => {
          const targetNode = this.nodes.find(n => n.id === connection.targetNodeId);
          if (targetNode) {
            const fromPos = this.getStepPosition(node, step);
            const toPos = this.getNodeCenterPosition(targetNode);
            
            if (fromPos && toPos) {
              this.connectionLines.push({
                from: fromPos,
                to: toPos,
                condition: connection.condition,
                type: step.type
              });
            }
          }
        });
      });
    });
  }

  private getStepPosition(node: Node, step: Step): { x: number; y: number } | null {
    // Calcular posição da etapa dentro do nó
    const nodeCenterX = node.position.x + 150; // Largura do nó / 2
    const nodeCenterY = node.position.y + 50; // Altura do cabeçalho / 2
    
    // Encontrar índice da etapa
    const stepIndex = node.steps.findIndex(s => s.id === step.id);
    if (stepIndex === -1) return null;
    
    // Posicionar a etapa na lateral direita do nó
    const stepX = node.position.x + 300; // Largura do nó + margem
    const stepY = node.position.y + 80 + (stepIndex * 40); // Cabeçalho + espaçamento
    
    return { x: stepX, y: stepY };
  }

  private getNodeCenterPosition(node: Node): { x: number; y: number } {
    return {
      x: node.position.x + 150, // Centro horizontal do nó
      y: node.position.y + 50   // Centro vertical do cabeçalho
    };
  }

  getLineStyle(line: ConnectionLine): any {
    return {
      'stroke-dasharray': line.type === 'decision' ? '5,5' : 'none',
      'stroke': this.getLineColor(line.type)
    };
  }

  getLineColor(type: string): string {
    switch (type) {
      case 'start': return '#28a745';
      case 'end': return '#dc3545';
      case 'decision': return '#ffc107';
      case 'parallel': return '#6f42c1';
      case 'process': return '#007bff';
      default: return '#6c757d';
    }
  }

  getPathD(line: ConnectionLine): string {
    const { from, to } = line;
    
    // Criar curva suave entre os pontos
    const midX = (from.x + to.x) / 2;
    const controlPoint1X = from.x + (midX - from.x) * 0.5;
    const controlPoint2X = to.x - (to.x - midX) * 0.5;
    
    return `M ${from.x} ${from.y} C ${controlPoint1X} ${from.y}, ${controlPoint2X} ${to.y}, ${to.x} ${to.y}`;
  }

  getArrowMarkerId(type: string): string {
    return `arrow-${type}`;
  }
}
