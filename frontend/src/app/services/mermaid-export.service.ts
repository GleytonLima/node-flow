import { Injectable } from '@angular/core';
import { Node, Step } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class MermaidExportService {

  constructor() {}

  /**
   * Exporta os nós para formato Mermaid
   */
  exportToMermaid(nodes: Node[]): string {
    // Validar e limpar dados
    const cleanNodes = this.validateAndCleanNodes(nodes);
    
    let mermaid = 'graph TD\n';
    
    // Mapear nós para IDs únicos
    const nodeMap = new Map<string, string>();
    cleanNodes.forEach((node, index) => {
      const nodeId = `N${index + 1}`;
      nodeMap.set(node.id, nodeId);
    });

    // Adicionar nós
    cleanNodes.forEach((node, index) => {
      const nodeId = nodeMap.get(node.id)!;
      const nodeLabel = this.escapeMermaidText(node.name);
      mermaid += `    ${nodeId}["${nodeLabel}"]\n`;
    });

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

    // Adicionar nós de decisão
    const decisionNodeMap = new Map<string, string>();
    decisionMap.forEach((decisionGroup, decisionKey) => {
      if (decisionGroup.conditionals.length > 0) {
        const decisionId = `D${decisionKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
        decisionNodeMap.set(decisionKey, decisionId);
        const decisionLabel = this.escapeMermaidText(decisionGroup.decisionName);
        mermaid += `    ${decisionId}{"${decisionLabel}"}\n`;
      }
    });

    // Adicionar conexões
    const connections = new Set<string>();
    
    // Segunda passada: Criar conexões normais
    cleanNodes.forEach(node => {
      const sourceNodeId = nodeMap.get(node.id)!;
      
      node.steps.forEach(step => {
        step.connections.forEach(connection => {
          const targetNode = cleanNodes.find(n => n.id === connection.targetNodeId);
          if (targetNode) {
            const targetNodeId = nodeMap.get(targetNode.id)!;
            
            if (step.type === 'conditional' && step.decisionStepId) {
              // Esta conexão será processada no grupo de decisão
              // Não fazer nada aqui, será processado abaixo
            } else {
              // Conexão normal (não condicional)
              const connectionKey = `${sourceNodeId}->${targetNodeId}`;
              if (!connections.has(connectionKey)) {
                connections.add(connectionKey);
                const stepLabel = this.escapeMermaidText(step.name);
                mermaid += `    ${sourceNodeId} -->|"${stepLabel}"| ${targetNodeId}\n`;
              }
            }
          }
        });
      });
    });

    // Terceira passada: Criar conexões das decisões
    decisionMap.forEach((decisionGroup, decisionKey) => {
      if (decisionGroup.conditionals.length > 0) {
        const sourceNodeId = nodeMap.get(decisionGroup.nodeId)!;
        const decisionId = decisionNodeMap.get(decisionKey)!;
        
        // Aresta do nó para o triângulo
        const connectionKey = `${sourceNodeId}->${decisionId}`;
        if (!connections.has(connectionKey)) {
          connections.add(connectionKey);
          mermaid += `    ${sourceNodeId} --> ${decisionId}\n`;
        }
        
        // Arestas do triângulo para os destinos das etapas condicionais
        decisionGroup.conditionals.forEach((conditional) => {
          conditional.connections.forEach((connection: any) => {
            const targetNode = cleanNodes.find(n => n.id === connection.targetNodeId);
            if (targetNode) {
              const targetNodeId = nodeMap.get(targetNode.id)!;
              const connectionKey = `${decisionId}->${targetNodeId}`;
              if (!connections.has(connectionKey)) {
                connections.add(connectionKey);
                const stepLabel = this.escapeMermaidText(conditional.step.name);
                mermaid += `    ${decisionId} -->|"${stepLabel}"| ${targetNodeId}\n`;
              }
            }
          });
        });
      }
    });

    return mermaid;
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
   * Escapa caracteres especiais para Mermaid
   */
  private escapeMermaidText(text: string): string {
    if (!text) return '';
    return text
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ');
  }

  /**
   * Faz download do arquivo Mermaid
   */
  downloadMermaid(mermaid: string, filename: string = 'resources-manager-diagram.mmd'): void {
    const blob = new Blob([mermaid], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Copia o diagrama Mermaid para a área de transferência
   */
  async copyToClipboard(mermaid: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(mermaid);
      return true;
    } catch (err) {
      console.error('Erro ao copiar para área de transferência:', err);
      return false;
    }
  }
}
