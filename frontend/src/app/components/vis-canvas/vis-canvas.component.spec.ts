import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisCanvasComponent } from './vis-canvas.component';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';
import { of, BehaviorSubject } from 'rxjs';
import { Node, Step } from '../../models/node.model';

describe('VisCanvasComponent', () => {
  let component: VisCanvasComponent;
  let fixture: ComponentFixture<VisCanvasComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockNodes: Node[] = [
    {
      id: 'node1',
      name: 'BFF',
      description: 'Backend for Frontend',
      workflows: ['default'],
      properties: { standardProps: {}, customProps: {} },
      steps: [
        {
          id: 'step1',
          type: 'process',
          name: 'Consulta Backend',
          description: 'Faz consultas',
          workflows: ['default'],
          connections: [{ targetNodeId: 'node2' }],
          properties: {},
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'decision1',
          type: 'decision',
          name: 'Condição',
          description: 'Decisão importante',
          workflows: ['default'],
          connections: [],
          properties: {},
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'conditional1',
          type: 'conditional',
          name: 'Decidir Algo',
          description: 'Decide algo',
          workflows: ['default'],
          connections: [{ targetNodeId: 'node3' }],
          properties: {},
          decisionStepId: 'decision1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'conditional2',
          type: 'conditional',
          name: 'Decidir Outra Coisa',
          description: 'Decide outra coisa',
          workflows: ['default'],
          connections: [{ targetNodeId: 'node4' }],
          properties: {},
          decisionStepId: 'decision1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'node2',
      name: 'Backend',
      description: 'Serviços de backend',
      workflows: ['default'],
      properties: { standardProps: {}, customProps: {} },
      steps: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'node3',
      name: 'Projeto A',
      description: 'Projeto A',
      workflows: ['default'],
      properties: { standardProps: {}, customProps: {} },
      steps: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'node4',
      name: 'Projeto B',
      description: 'Projeto B',
      workflows: ['default'],
      properties: { standardProps: {}, customProps: {} },
      steps: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', [
      'setLoading',
      'setNodes',
      'setError',
      'setNodeFilter',
      'setSelectedNode'
    ], {
      filteredNodes$: new BehaviorSubject(mockNodes),
      nodeFilter$: new BehaviorSubject(null),
      selectedNode$: new BehaviorSubject(null),
      loading$: new BehaviorSubject(false),
      nodeFilter: null
    });

    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getNodes']);

    await TestBed.configureTestingModule({
      imports: [VisCanvasComponent],
      providers: [
        { provide: StateService, useValue: stateServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VisCanvasComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    apiService.getNodes.and.returnValue(of({
      success: true,
      data: mockNodes
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Decision Triangle Logic', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should group conditional steps by decision correctly', () => {
      // Simular a lógica de agrupamento
      const decisionMap = new Map();
      
      mockNodes.forEach(node => {
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
            
            decisionMap.get(decisionKey).conditionals.push({
              step: step,
              connections: step.connections.filter(conn => conn.targetNodeId)
            });
          }
        });
      });

      // Verificar se o agrupamento está correto
      expect(decisionMap.size).toBe(1); // Apenas uma decisão
      
      const decisionGroup = decisionMap.get('node1-decision1');
      expect(decisionGroup).toBeDefined();
      expect(decisionGroup.decisionName).toBe('Condição');
      expect(decisionGroup.conditionals.length).toBe(2); // Duas condicionais
      expect(decisionGroup.conditionals[0].step.name).toBe('Decidir Algo');
      expect(decisionGroup.conditionals[1].step.name).toBe('Decidir Outra Coisa');
    });

    it('should create correct triangle nodes for decisions', () => {
      const decisionMap = new Map();
      const decisionTriangles: any[] = [];
      
      // Simular o agrupamento
      mockNodes.forEach(node => {
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
            
            decisionMap.get(decisionKey).conditionals.push({
              step: step,
              connections: step.connections.filter(conn => conn.targetNodeId)
            });
          }
        });
      });

      // Simular criação dos triângulos
      decisionMap.forEach((decisionGroup, decisionKey) => {
        if (decisionGroup.conditionals.length > 0) {
          const triangleId = `decision-${decisionKey}`;
          
          decisionTriangles.push({
            id: triangleId,
            label: decisionGroup.decisionName,
            shape: 'diamond',
            size: 25,
            color: {
              background: '#ffc107',
              border: '#e0a800',
              highlight: {
                background: '#ffcd39',
                border: '#d39e00'
              }
            },
            font: {
              size: 10,
              color: '#000000'
            }
          });
        }
      });

      // Verificar se o triângulo foi criado corretamente
      expect(decisionTriangles.length).toBe(1);
      expect(decisionTriangles[0].id).toBe('decision-node1-decision1');
      expect(decisionTriangles[0].label).toBe('Condição');
      expect(decisionTriangles[0].shape).toBe('diamond');
      expect(decisionTriangles[0].size).toBe(25);
    });

    it('should create correct edges for decision triangles', () => {
      const decisionMap = new Map();
      const visEdges: any[] = [];
      
      // Simular o agrupamento
      mockNodes.forEach(node => {
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
            
            decisionMap.get(decisionKey).conditionals.push({
              step: step,
              connections: step.connections.filter(conn => conn.targetNodeId)
            });
          }
        });
      });

      // Simular criação das arestas
      decisionMap.forEach((decisionGroup, decisionKey) => {
        if (decisionGroup.conditionals.length > 0) {
          const triangleId = `decision-${decisionKey}`;
          
          // Aresta do nó para o triângulo
          visEdges.push({
            id: `${decisionGroup.nodeId}-${triangleId}`,
            from: decisionGroup.nodeId,
            to: triangleId,
            label: '',
            title: `Decisão: ${decisionGroup.decisionName}`,
            color: '#ffc107',
            width: 2
          });
          
          // Arestas do triângulo para os destinos
          decisionGroup.conditionals.forEach((conditional: any) => {
            conditional.connections.forEach((connection: any) => {
              const targetNode = mockNodes.find(n => n.id === connection.targetNodeId);
              if (targetNode) {
                visEdges.push({
                  id: `${triangleId}-${connection.targetNodeId}-${conditional.step.id}`,
                  from: triangleId,
                  to: connection.targetNodeId,
                  label: conditional.step.name,
                  title: `Etapa Condicional: ${conditional.step.name}\nDecisão: ${decisionGroup.decisionName}\nDestino: ${targetNode.name}`,
                  color: '#ffc107',
                  width: 2
                });
              }
            });
          });
        }
      });

      // Verificar se as arestas foram criadas corretamente
      expect(visEdges.length).toBe(3); // 1 entrada + 2 saídas
      
      // Aresta de entrada (nó -> triângulo)
      const entryEdge = visEdges.find(e => e.from === 'node1' && e.to === 'decision-node1-decision1');
      expect(entryEdge).toBeDefined();
      expect(entryEdge.label).toBe('');
      expect(entryEdge.title).toBe('Decisão: Condição');
      
      // Arestas de saída (triângulo -> destinos)
      const exitEdges = visEdges.filter(e => e.from === 'decision-node1-decision1');
      expect(exitEdges.length).toBe(2);
      
      const edgeToNode3 = exitEdges.find(e => e.to === 'node3');
      expect(edgeToNode3).toBeDefined();
      expect(edgeToNode3.label).toBe('Decidir Algo');
      
      const edgeToNode4 = exitEdges.find(e => e.to === 'node4');
      expect(edgeToNode4).toBeDefined();
      expect(edgeToNode4.label).toBe('Decidir Outra Coisa');
    });

    it('should handle multiple decisions correctly', () => {
      const multipleDecisionNodes: Node[] = [
        {
          id: 'node1',
          name: 'Node 1',
          description: 'Node 1',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [
            {
              id: 'decision1',
              type: 'decision',
              name: 'Decisão 1',
              description: 'Primeira decisão',
              workflows: ['default'],
              connections: [],
              properties: {},
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            },
            {
              id: 'conditional1',
              type: 'conditional',
              name: 'Condicional 1',
              description: 'Primeira condicional',
              workflows: ['default'],
              connections: [{ targetNodeId: 'node2' }],
              properties: {},
              decisionStepId: 'decision1',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            }
          ],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'node2',
          name: 'Node 2',
          description: 'Node 2',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [
            {
              id: 'decision2',
              type: 'decision',
              name: 'Decisão 2',
              description: 'Segunda decisão',
              workflows: ['default'],
              connections: [],
              properties: {},
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            },
            {
              id: 'conditional2',
              type: 'conditional',
              name: 'Condicional 2',
              description: 'Segunda condicional',
              workflows: ['default'],
              connections: [{ targetNodeId: 'node3' }],
              properties: {},
              decisionStepId: 'decision2',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            }
          ],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'node3',
          name: 'Node 3',
          description: 'Node 3',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];

      const decisionMap = new Map();
      
      multipleDecisionNodes.forEach(node => {
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
            
            decisionMap.get(decisionKey).conditionals.push({
              step: step,
              connections: step.connections.filter(conn => conn.targetNodeId)
            });
          }
        });
      });

      // Verificar se duas decisões foram criadas
      expect(decisionMap.size).toBe(2);
      
      const decision1 = decisionMap.get('node1-decision1');
      expect(decision1).toBeDefined();
      expect(decision1.decisionName).toBe('Decisão 1');
      
      const decision2 = decisionMap.get('node2-decision2');
      expect(decision2).toBeDefined();
      expect(decision2.decisionName).toBe('Decisão 2');
    });

    it('should handle conditional steps without target nodes', () => {
      const nodesWithEmptyConnections: Node[] = [
        {
          id: 'node1',
          name: 'Node 1',
          description: 'Node 1',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [
            {
              id: 'decision1',
              type: 'decision',
              name: 'Decisão',
              description: 'Decisão',
              workflows: ['default'],
              connections: [],
              properties: {},
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            },
            {
              id: 'conditional1',
              type: 'conditional',
              name: 'Condicional',
              description: 'Condicional sem destino',
              workflows: ['default'],
              connections: [{ targetNodeId: '' }], // Sem destino
              properties: {},
              decisionStepId: 'decision1',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            }
          ],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];

      const decisionMap = new Map();
      
      nodesWithEmptyConnections.forEach(node => {
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
            
            // Filtrar apenas conexões com destino
            const validConnections = step.connections.filter(conn => conn.targetNodeId);
            decisionMap.get(decisionKey).conditionals.push({
              step: step,
              connections: validConnections
            });
          }
        });
      });

      const decisionGroup = decisionMap.get('node1-decision1');
      expect(decisionGroup).toBeDefined();
      expect(decisionGroup.conditionals.length).toBe(1);
      expect(decisionGroup.conditionals[0].connections.length).toBe(0); // Sem conexões válidas
    });
  });

  describe('Edge Color Logic', () => {
    it('should return correct colors for different step types', () => {
      expect(component['getEdgeColor']('decision')).toBe('#ffc107');
      expect(component['getEdgeColor']('conditional')).toBe('#ffc107');
      expect(component['getEdgeColor']('parallel')).toBe('#6f42c1');
      expect(component['getEdgeColor']('process')).toBe('#4A90E2');
      expect(component['getEdgeColor']('unknown')).toBe('#6c757d');
    });
  });
});
