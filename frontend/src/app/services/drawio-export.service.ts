import { Injectable } from '@angular/core';
import { Node, Step, Connection } from '../models/node.model';

export interface DrawioCell {
  id: string;
  value: string;
  style: string;
  vertex: number;
  parent: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  source?: string;
  target?: string;
  edge?: number;
}

export interface DrawioDiagram {
  cells: DrawioCell[];
}

export interface DrawioXml {
  mxfile: {
    diagram: {
      mxGraphModel: {
        root: {
          mxCell: DrawioCell[];
        };
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class DrawioExportService {
  private readonly NODE_WIDTH = 180;
  private readonly NODE_HEIGHT = 80;
  private readonly STEP_WIDTH = 150;
  private readonly STEP_HEIGHT = 80;
  private readonly HORIZONTAL_SPACING = 300;
  private readonly VERTICAL_SPACING = 150;
  private readonly STEP_VERTICAL_SPACING = 100;

  constructor() {
    console.log('🏗️ DrawioExportService - Construtor chamado');
  }

  /**
   * Exporta os nós para XML do Draw.io
   */
  exportToDrawioXml(nodes: Node[]): string {
    try {
      const timestamp = Date.now();
      console.log('🔧 Draw.io Export Service - Iniciando exportação', timestamp);
      console.log('📊 Nós recebidos:', nodes.length);
      
      // Validar e limpar dados
      const cleanNodes = this.validateAndCleanNodes(nodes);
      console.log('🧹 Nós limpos:', cleanNodes.length);
    
    const cells: DrawioCell[] = [];
    const nodeMap = new Map<string, DrawioCell>(); // Mapa para rastrear células dos nós
    
    // Célula raiz
    cells.push(this.createRootCell());
    
    // Célula padrão
    cells.push(this.createDefaultCell());
    
    // Layout hierárquico - calcular posições
    const layout = this.calculateHierarchicalLayout(cleanNodes);
    
    // Criar nós principais - apenas uma vez cada
    const processedNodes = new Set<string>();
    cleanNodes.forEach((node, index) => {
      if (!processedNodes.has(node.id)) {
        const position = layout.nodePositions.get(node.id);
        if (position) {
          const nodeCell = this.createNodeCell(node, position.x, position.y);
          cells.push(nodeCell);
          nodeMap.set(node.id, nodeCell);
          processedNodes.add(node.id);
          console.log('✅ Nó criado:', node.name, 'ID:', node.id);
        }
      }
    });
    console.log('📦 Total de nós criados:', processedNodes.size);

    // Agrupar etapas condicionais por decisão (mesma lógica do vis-canvas)
    const decisionMap = new Map<string, { nodeId: string, decisionStepId: string, decisionName: string, conditionals: any[] }>();
    
    // Primeira passada: Agrupar etapas condicionais por decisão
    cleanNodes.forEach(node => {
      node.steps.forEach(step => {
        if (step.type === 'conditional' && step.decisionStepId) {
          const decisionStep = node.steps.find(s => s.id === step.decisionStepId);
          const decisionName = decisionStep ? decisionStep.name : 'Decisão';
          const decisionKey = `${node.id}-${step.decisionStepId}`;
          
          if (!decisionMap.has(decisionKey)) {
            decisionMap.set(decisionKey, {
              nodeId: node.id,
              decisionStepId: step.decisionStepId,
              decisionName: decisionName,
              conditionals: []
            });
          }
          
          // Adicionar etapa condicional ao grupo
          decisionMap.get(decisionKey)!.conditionals.push({
            step: step,
            connections: step.connections.filter(conn => conn.targetNodeId) // Apenas conexões com destino
          });
        }
      });
    });

    // Criar nós de decisão - apenas uma vez cada
    const decisionNodeMap = new Map<string, DrawioCell>();
    const processedDecisions = new Set<string>();
    decisionMap.forEach((decisionGroup, decisionKey) => {
      if (decisionGroup.conditionals.length > 0 && !processedDecisions.has(decisionKey)) {
        const position = layout.decisionPositions.get(decisionKey);
        if (position) {
          const decisionCell = this.createDecisionCell(decisionGroup.decisionName, position.x, position.y);
          cells.push(decisionCell);
          decisionNodeMap.set(decisionKey, decisionCell);
          processedDecisions.add(decisionKey);
          console.log('💎 Decisão criada:', decisionGroup.decisionName, 'Key:', decisionKey);
        }
      }
    });
    console.log('💎 Total de decisões criadas:', processedDecisions.size);

    // Criar conexões normais (apenas entre nós)
    const connections = new Set<string>();
    
    cleanNodes.forEach(node => {
      const sourceNodeCell = nodeMap.get(node.id);
      if (!sourceNodeCell) return;
      
      node.steps.forEach(step => {
        step.connections.forEach(connection => {
          const targetNode = cleanNodes.find(n => n.id === connection.targetNodeId);
          if (targetNode) {
            const targetNodeCell = nodeMap.get(targetNode.id);
            if (targetNodeCell) {
              if (step.type === 'conditional' && step.decisionStepId) {
                // Esta conexão será processada no grupo de decisão
                // Não fazer nada aqui, será processado abaixo
              } else {
                // Conexão normal (não condicional) - apenas entre nós
                const connectionKey = `${sourceNodeCell.id}->${targetNodeCell.id}`;
                if (!connections.has(connectionKey)) {
                  connections.add(connectionKey);
                  const connectionCell = this.createConnectionCell(
                    sourceNodeCell.id,
                    targetNodeCell.id,
                    step.name
                  );
                  cells.push(connectionCell);
                }
              }
            }
          }
        });
      });
    });

    // Criar conexões das decisões
    decisionMap.forEach((decisionGroup, decisionKey) => {
      if (decisionGroup.conditionals.length > 0) {
        const sourceNodeCell = nodeMap.get(decisionGroup.nodeId);
        const decisionCell = decisionNodeMap.get(decisionKey);
        
        if (sourceNodeCell && decisionCell) {
          // Aresta do nó para o triângulo
          const connectionKey = `${sourceNodeCell.id}->${decisionCell.id}`;
          if (!connections.has(connectionKey)) {
            connections.add(connectionKey);
            const connectionCell = this.createConnectionCell(
              sourceNodeCell.id,
              decisionCell.id,
              ''
            );
            cells.push(connectionCell);
          }
          
          // Arestas do triângulo para os destinos das etapas condicionais
          decisionGroup.conditionals.forEach((conditional) => {
            conditional.connections.forEach((connection: any) => {
              const targetNode = cleanNodes.find(n => n.id === connection.targetNodeId);
              if (targetNode) {
                const targetNodeCell = nodeMap.get(targetNode.id);
                if (targetNodeCell) {
                  const connectionKey = `${decisionCell.id}->${targetNodeCell.id}`;
                  if (!connections.has(connectionKey)) {
                    connections.add(connectionKey);
                    const connectionCell = this.createConnectionCell(
                      decisionCell.id,
                      targetNodeCell.id,
                      conditional.step.name
                    );
                    cells.push(connectionCell);
                  }
                }
              }
            });
          });
        }
      }
    });
    
      // Criar XML
      const diagram: DrawioDiagram = { cells };
      console.log('📄 Total de células no XML:', cells.length);
      console.log('🔧 Draw.io Export Service - Exportação concluída');
      return this.generateXml(diagram);
    } catch (error) {
      console.error('❌ Erro no Draw.io Export Service:', error);
      throw error;
    }
  }

  /**
   * Valida e limpa os dados dos nós
   */
  private validateAndCleanNodes(nodes: Node[]): Node[] {
    return nodes.map(node => ({
      ...node,
      name: this.cleanText(node.name),
      description: this.cleanText(node.description),
      steps: node.steps.map(step => ({
        ...step,
        name: this.cleanText(step.name),
        description: this.cleanText(step.description),
        connections: step.connections
      }))
    }));
  }

  /**
   * Limpa texto removendo caracteres problemáticos
   */
  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Cria célula raiz
   */
  private createRootCell(): DrawioCell {
    return {
      id: '0',
      value: '',
      style: '',
      vertex: 0,
      parent: '',
      geometry: { x: 0, y: 0, width: 0, height: 0 }
    };
  }

  /**
   * Cria célula padrão
   */
  private createDefaultCell(): DrawioCell {
    return {
      id: '1',
      value: '',
      style: '',
      vertex: 0,
      parent: '0',
      geometry: { x: 0, y: 0, width: 0, height: 0 }
    };
  }

  /**
   * Cria célula para um nó
   */
  private createNodeCell(node: Node, x: number, y: number): DrawioCell {
    const nodeInfo = this.formatNodeInfo(node);
    
    return {
      id: `node_${node.id}`,
      value: nodeInfo,
      style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#4A90E2;fontStyle=1;fontSize=14;',
      vertex: 1,
      parent: '1',
      geometry: {
        x: x,
        y: y,
        width: this.NODE_WIDTH,
        height: this.NODE_HEIGHT
      }
    };
  }


  /**
   * Cria célula para um nó de decisão (diamante)
   */
  private createDecisionCell(decisionName: string, x: number, y: number): DrawioCell {
    return {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      value: this.escapeHtml(decisionName),
      style: 'rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;fontStyle=1;',
      vertex: 1,
      parent: '1',
      geometry: {
        x: x,
        y: y,
        width: 120,
        height: 80
      }
    };
  }

  /**
   * Calcula layout hierárquico para os nós
   */
  private calculateHierarchicalLayout(nodes: Node[]): {
    nodePositions: Map<string, { x: number, y: number }>;
    decisionPositions: Map<string, { x: number, y: number }>;
  } {
    const nodePositions = new Map<string, { x: number, y: number }>();
    const decisionPositions = new Map<string, { x: number, y: number }>();
    
    // Layout simples e direto - replicar o vis-canvas
    const startX = 200;
    const startY = 100;
    const levelSeparation = 300;
    const nodeSpacing = 400;
    
    // Agrupar nós por "nível" baseado em suas conexões
    const levels = this.calculateNodeLevels(nodes);
    
    // Posicionar nós por nível - distribuição horizontal simples
    levels.forEach((levelNodes, levelIndex) => {
      const y = startY + (levelIndex * levelSeparation);
      
      // Distribuir nós horizontalmente no nível
      levelNodes.forEach((node, nodeIndex) => {
        const x = startX + (nodeIndex * nodeSpacing);
        nodePositions.set(node.id, { x, y });
      });
    });
    
    // Encontrar todas as decisões
    const decisionMap = new Map<string, { nodeId: string, decisionStepId: string, decisionName: string, conditionals: any[] }>();
    
    nodes.forEach(node => {
      node.steps.forEach(step => {
        if (step.type === 'conditional' && step.decisionStepId) {
          const decisionStep = node.steps.find(s => s.id === step.decisionStepId);
          const decisionName = decisionStep ? decisionStep.name : 'Decisão';
          const decisionKey = `${node.id}-${step.decisionStepId}`;
          
          if (!decisionMap.has(decisionKey)) {
            decisionMap.set(decisionKey, {
              nodeId: node.id,
              decisionStepId: step.decisionStepId,
              decisionName: decisionName,
              conditionals: []
            });
          }
          
          decisionMap.get(decisionKey)!.conditionals.push({
            step: step,
            connections: step.connections.filter(conn => conn.targetNodeId)
          });
        }
      });
    });
    
    // Posicionar decisões - colocar entre os níveis dos nós
    const maxLevel = Math.max(...Array.from(levels.keys()));
    const decisionLevel = maxLevel + 1;
    const decisionY = startY + (decisionLevel * levelSeparation);
    
    // Distribuir decisões horizontalmente
    let decisionIndex = 0;
    decisionMap.forEach((decisionGroup, decisionKey) => {
      if (decisionGroup.conditionals.length > 0) {
        const x = startX + (decisionIndex * nodeSpacing);
        decisionPositions.set(decisionKey, { x, y: decisionY });
        decisionIndex++;
      }
    });
    
    return { nodePositions, decisionPositions };
  }

  /**
   * Calcula níveis hierárquicos dos nós baseado em suas conexões
   */
  private calculateNodeLevels(nodes: Node[]): Map<number, Node[]> {
    const levels = new Map<number, Node[]>();
    const nodeLevels = new Map<string, number>();
    const visited = new Set<string>();
    
    // Encontrar nós raiz (sem conexões de entrada)
    const rootNodes = nodes.filter(node => {
      return !nodes.some(otherNode => 
        otherNode.steps.some(step => 
          step.connections.some(conn => conn.targetNodeId === node.id)
        )
      );
    });
    
    // Se não há nós raiz, usar todos os nós como nível 0
    const startingNodes = rootNodes.length > 0 ? rootNodes : nodes;
    
    // Atribuir nível 0 aos nós iniciais
    startingNodes.forEach(node => {
      nodeLevels.set(node.id, 0);
      if (!levels.has(0)) {
        levels.set(0, []);
      }
      levels.get(0)!.push(node);
      visited.add(node.id);
    });
    
    // BFS para calcular níveis dos outros nós
    const queue = [...startingNodes];
    
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      const currentLevel = nodeLevels.get(currentNode.id) || 0;
      
      // Processar conexões do nó atual
      currentNode.steps.forEach(step => {
        step.connections.forEach(connection => {
          const targetNode = nodes.find(n => n.id === connection.targetNodeId);
          if (targetNode && !visited.has(targetNode.id)) {
            const newLevel = currentLevel + 1;
            nodeLevels.set(targetNode.id, newLevel);
            visited.add(targetNode.id);
            
            if (!levels.has(newLevel)) {
              levels.set(newLevel, []);
            }
            levels.get(newLevel)!.push(targetNode);
            queue.push(targetNode);
          }
        });
      });
    }
    
    // Adicionar nós não conectados ao nível 0 (evitar duplicatas)
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        if (!levels.has(0)) {
          levels.set(0, []);
        }
        // Verificar se o nó já não está no nível 0
        const level0Nodes = levels.get(0)!;
        if (!level0Nodes.some(n => n.id === node.id)) {
          level0Nodes.push(node);
        }
      }
    });
    
    return levels;
  }

  /**
   * Cria célula de conexão
   */
  private createConnectionCell(sourceId: string, targetId: string, label: string): DrawioCell {
    const labelStyle = label ? 'fontSize=12;fontColor=#333333;' : '';
    
    return {
      id: `conn_${sourceId}_${targetId}_${Date.now()}`,
      value: label,
      style: `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;${labelStyle}`,
      vertex: 0,
      parent: '1',
      edge: 1,
      source: sourceId,
      target: targetId,
      geometry: { x: 0, y: 0, width: 0, height: 0 }
    };
  }

  /**
   * Formata informações do nó para exibição
   */
  private formatNodeInfo(node: Node): string {
    return `<b>${this.escapeHtml(node.name)}</b>`;
  }



  /**
   * Escapa caracteres HTML e XML
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '&#10;')
      .replace(/\r/g, '&#13;')
      .replace(/\t/g, '&#9;');
  }

  /**
   * Escapa atributos XML
   */
  private escapeXmlAttribute(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '&#10;')
      .replace(/\r/g, '&#13;')
      .replace(/\t/g, '&#9;');
  }

  /**
   * Gera XML final
   */
  private generateXml(diagram: DrawioDiagram): string {
    const timestamp = new Date().toISOString();
    const exportId = `export-${Date.now()}`;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${timestamp}" agent="Resources Manager Export" version="24.7.17" etag="${exportId}">
  <diagram name="Resources Manager Export" id="${exportId}">
    <mxGraphModel dx="1422" dy="754" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${diagram.cells.slice(2).map(cell => this.cellToXml(cell)).join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
    
    return xml;
  }

  /**
   * Converte célula para XML
   */
  private cellToXml(cell: DrawioCell): string {
    const attrs = [
      `id="${this.escapeXmlAttribute(cell.id)}"`,
      `value="${this.escapeXmlAttribute(cell.value)}"`,
      `style="${this.escapeXmlAttribute(cell.style)}"`,
      `vertex="${cell.vertex}"`,
      `parent="${this.escapeXmlAttribute(cell.parent)}"`
    ];

    if (cell.edge) {
      attrs.push(`edge="${cell.edge}"`);
    }

    if (cell.source) {
      attrs.push(`source="${this.escapeXmlAttribute(cell.source)}"`);
    }

    if (cell.target) {
      attrs.push(`target="${this.escapeXmlAttribute(cell.target)}"`);
    }

    const geometry = `<mxGeometry x="${cell.geometry.x}" y="${cell.geometry.y}" width="${cell.geometry.width}" height="${cell.geometry.height}" as="geometry" />`;

    return `<mxCell ${attrs.join(' ')}>${geometry}</mxCell>`;
  }

  /**
   * Faz download do arquivo XML
   */
  downloadXml(xml: string, filename: string = 'resources-manager-export.drawio'): void {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
