import { Injectable } from '@angular/core';
import { Node } from '../models/node.model';

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  connections: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly NODE_WIDTH = 300;
  private readonly NODE_HEIGHT = 200;
  private readonly LEVEL_SPACING = 400;
  private readonly NODE_SPACING = 350;

  /**
   * Aplica layout automático aos nós baseado em suas conexões
   */
  applyAutoLayout(nodes: Node[]): Node[] {
    if (nodes.length === 0) return nodes;

    // Criar grafo de conexões
    const graph = this.buildConnectionGraph(nodes);
    
    // Aplicar algoritmo de layout hierárquico
    const layoutNodes = this.calculateHierarchicalLayout(graph, nodes);
    
    // Atualizar posições dos nós
    return this.updateNodePositions(nodes, layoutNodes);
  }

  /**
   * Constrói grafo de conexões entre nós
   */
  private buildConnectionGraph(nodes: Node[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Inicializar grafo
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    // Adicionar conexões
    nodes.forEach(node => {
      node.steps.forEach(step => {
        step.connections.forEach(connection => {
          const connections = graph.get(node.id) || [];
          if (!connections.includes(connection.targetNodeId)) {
            connections.push(connection.targetNodeId);
          }
          graph.set(node.id, connections);
        });
      });
    });

    return graph;
  }

  /**
   * Calcula layout hierárquico usando algoritmo de camadas
   */
  private calculateHierarchicalLayout(graph: Map<string, string[]>, nodes: Node[]): LayoutNode[] {
    const layoutNodes: LayoutNode[] = [];
    const visited = new Set<string>();
    const levels = new Map<number, string[]>();

    // Encontrar nós raiz (sem conexões de entrada)
    const rootNodes = this.findRootNodes(graph, nodes);
    
    // Atribuir níveis usando BFS
    const queue: { nodeId: string; level: number }[] = [];
    
    rootNodes.forEach(nodeId => {
      queue.push({ nodeId, level: 0 });
      visited.add(nodeId);
    });

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      
      // Adicionar ao nível
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(nodeId);

      // Processar conexões
      const connections = graph.get(nodeId) || [];
      connections.forEach(targetId => {
        if (!visited.has(targetId)) {
          queue.push({ nodeId: targetId, level: level + 1 });
          visited.add(targetId);
        }
      });
    }

    // Processar nós órfãos (sem conexões)
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const orphanLevel = levels.size;
        if (!levels.has(orphanLevel)) {
          levels.set(orphanLevel, []);
        }
        levels.get(orphanLevel)!.push(node.id);
      }
    });

    // Calcular posições
    levels.forEach((nodeIds, level) => {
      nodeIds.forEach((nodeId, index) => {
        const x = level * this.LEVEL_SPACING;
        const y = index * this.NODE_SPACING;
        
        layoutNodes.push({
          id: nodeId,
          x,
          y,
          width: this.NODE_WIDTH,
          height: this.NODE_HEIGHT,
          level,
          connections: graph.get(nodeId) || []
        });
      });
    });

    return layoutNodes;
  }

  /**
   * Encontra nós raiz (sem conexões de entrada)
   */
  private findRootNodes(graph: Map<string, string[]>, nodes: Node[]): string[] {
    const hasIncomingConnections = new Set<string>();
    
    // Marcar nós que têm conexões de entrada
    graph.forEach(connections => {
      connections.forEach(targetId => {
        hasIncomingConnections.add(targetId);
      });
    });

    // Retornar nós sem conexões de entrada
    return nodes
      .map(node => node.id)
      .filter(nodeId => !hasIncomingConnections.has(nodeId));
  }

  /**
   * Atualiza posições dos nós baseado no layout calculado
   */
  private updateNodePositions(nodes: Node[], layoutNodes: LayoutNode[]): Node[] {
    const layoutMap = new Map<string, LayoutNode>();
    layoutNodes.forEach(layoutNode => {
      layoutMap.set(layoutNode.id, layoutNode);
    });

    return nodes.map(node => {
      const layout = layoutMap.get(node.id);
      if (layout) {
        return {
          ...node,
          position: {
            x: layout.x,
            y: layout.y
          }
        };
      }
      return node;
    });
  }

  /**
   * Aplica layout circular para nós sem conexões específicas
   */
  applyCircularLayout(nodes: Node[]): Node[] {
    if (nodes.length === 0) return nodes;

    const centerX = 400;
    const centerY = 300;
    const radius = Math.max(200, nodes.length * 50);
    
    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      const x = centerX + radius * Math.cos(angle) - this.NODE_WIDTH / 2;
      const y = centerY + radius * Math.sin(angle) - this.NODE_HEIGHT / 2;
      
      return {
        ...node,
        position: { x, y }
      };
    });
  }

  /**
   * Aplica layout em grade para nós
   */
  applyGridLayout(nodes: Node[]): Node[] {
    if (nodes.length === 0) return nodes;

    const cols = Math.ceil(Math.sqrt(nodes.length));
    const startX = 100;
    const startY = 100;
    
    return nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = startX + col * this.NODE_SPACING;
      const y = startY + row * this.NODE_SPACING;
      
      return {
        ...node,
        position: { x, y }
      };
    });
  }
}
