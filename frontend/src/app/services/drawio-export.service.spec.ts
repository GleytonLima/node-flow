import { TestBed } from '@angular/core/testing';
import { DrawioExportService } from './drawio-export.service';
import { Node, Step } from '../models/node.model';

describe('DrawioExportService', () => {
  let service: DrawioExportService;

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
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrawioExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportToDrawioXml', () => {
    it('should generate valid XML for nodes', () => {
      const xml = service.exportToDrawioXml(mockNodes);
      
      expect(xml).toBeTruthy();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<mxfile');
      expect(xml).toContain('<diagram');
      expect(xml).toContain('<mxGraphModel');
    });

    it('should include all nodes in the XML', () => {
      const xml = service.exportToDrawioXml(mockNodes);
      
      mockNodes.forEach(node => {
        expect(xml).toContain(`node_${node.id}`);
        expect(xml).toContain(service['escapeHtml'](node.name));
      });
    });

    it('should include all steps in the XML', () => {
      const xml = service.exportToDrawioXml(mockNodes);
      
      mockNodes.forEach(node => {
        node.steps.forEach(step => {
          expect(xml).toContain(`step_${step.id}`);
          expect(xml).toContain(service['escapeHtml'](step.name));
        });
      });
    });

    it('should create connections between nodes and steps', () => {
      const xml = service.exportToDrawioXml(mockNodes);
      
      // Verificar conexão do nó para a primeira etapa
      expect(xml).toContain('Início');
      
      // Verificar conexões das etapas para outros nós
      expect(xml).toContain('Conecta');
    });

    it('should handle empty nodes array', () => {
      const xml = service.exportToDrawioXml([]);
      
      expect(xml).toBeTruthy();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<mxfile');
    });

    it('should handle nodes without steps', () => {
      const nodesWithoutSteps: Node[] = [
        {
          id: 'node1',
          name: 'Node 1',
          description: 'Node without steps',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];

      const xml = service.exportToDrawioXml(nodesWithoutSteps);
      
      expect(xml).toBeTruthy();
      expect(xml).toContain('node_node1');
      expect(xml).toContain('Node 1');
    });
  });

  describe('validateAndCleanNodes', () => {
    it('should clean text in node names and descriptions', () => {
      const dirtyNodes: Node[] = [
        {
          id: 'node1',
          name: '  Node with   extra   spaces  ',
          description: 'Description\nwith\tnewlines\r\nand\ttabs',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];

      const cleanedNodes = service['validateAndCleanNodes'](dirtyNodes);
      
      expect(cleanedNodes[0].name).toBe('Node with extra spaces');
      expect(cleanedNodes[0].description).toBe('Description with newlines and tabs');
    });

    it('should clean text in step names and descriptions', () => {
      const nodesWithDirtySteps: Node[] = [
        {
          id: 'node1',
          name: 'Node 1',
          description: 'Node 1',
          workflows: ['default'],
          properties: { standardProps: {}, customProps: {} },
          steps: [
            {
              id: 'step1',
              type: 'process',
              name: '  Step with   spaces  ',
              description: 'Step\ndescription\twith\ttabs',
              workflows: ['default'],
              connections: [],
              properties: {},
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            }
          ],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];

      const cleanedNodes = service['validateAndCleanNodes'](nodesWithDirtySteps);
      
      expect(cleanedNodes[0].steps[0].name).toBe('Step with spaces');
      expect(cleanedNodes[0].steps[0].description).toBe('Step description with tabs');
    });
  });

  describe('cleanText', () => {
    it('should remove control characters', () => {
      const dirtyText = 'Text\x00with\x08control\x1Fcharacters';
      const cleanText = service['cleanText'](dirtyText);
      
      expect(cleanText).toBe('Textwithcontrolcharacters');
    });

    it('should normalize spaces', () => {
      const dirtyText = 'Text   with    multiple     spaces';
      const cleanText = service['cleanText'](dirtyText);
      
      expect(cleanText).toBe('Text with multiple spaces');
    });

    it('should trim whitespace', () => {
      const dirtyText = '  Text with spaces  ';
      const cleanText = service['cleanText'](dirtyText);
      
      expect(cleanText).toBe('Text with spaces');
    });

    it('should handle empty or null text', () => {
      expect(service['cleanText']('')).toBe('');
      expect(service['cleanText'](null as any)).toBe('');
      expect(service['cleanText'](undefined as any)).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      const htmlText = '<script>alert("test")</script>';
      const escapedText = service['escapeHtml'](htmlText);
      
      expect(escapedText).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      const text = 'A & B & C';
      const escapedText = service['escapeHtml'](text);
      
      expect(escapedText).toBe('A &amp; B &amp; C');
    });

    it('should escape quotes', () => {
      const text = 'He said "Hello" and \'Goodbye\'';
      const escapedText = service['escapeHtml'](text);
      
      expect(escapedText).toBe('He said &quot;Hello&quot; and &#39;Goodbye&#39;');
    });

    it('should handle newlines and tabs', () => {
      const text = 'Line1\nLine2\r\nLine3\tTab';
      const escapedText = service['escapeHtml'](text);
      
      expect(escapedText).toBe('Line1&#10;Line2&#13;&#10;Line3&#9;Tab');
    });

    it('should handle empty or null text', () => {
      expect(service['escapeHtml']('')).toBe('');
      expect(service['escapeHtml'](null as any)).toBe('');
      expect(service['escapeHtml'](undefined as any)).toBe('');
    });
  });

  describe('escapeXmlAttribute', () => {
    it('should escape XML attribute characters', () => {
      const xmlText = 'value with "quotes" and <tags>';
      const escapedText = service['escapeXmlAttribute'](xmlText);
      
      expect(escapedText).toBe('value with &quot;quotes&quot; and &lt;tags&gt;');
    });

    it('should handle empty or null text', () => {
      expect(service['escapeXmlAttribute']('')).toBe('');
      expect(service['escapeXmlAttribute'](null as any)).toBe('');
      expect(service['escapeXmlAttribute'](undefined as any)).toBe('');
    });
  });

  describe('getStepStyle', () => {
    it('should return correct style for decision steps', () => {
      const style = service['getStepStyle']('decision');
      
      expect(style).toContain('rhombus');
      expect(style).toContain('#fff2cc');
      expect(style).toContain('#d6b656');
    });

    it('should return correct style for parallel steps', () => {
      const style = service['getStepStyle']('parallel');
      
      expect(style).toContain('rounded=1');
      expect(style).toContain('#e1d5e7');
      expect(style).toContain('#9673a6');
    });

    it('should return correct style for process steps', () => {
      const style = service['getStepStyle']('process');
      
      expect(style).toContain('rounded=1');
      expect(style).toContain('#d5e8d4');
      expect(style).toContain('#82b366');
    });

    it('should return default style for unknown step types', () => {
      const style = service['getStepStyle']('unknown');
      
      expect(style).toContain('rounded=1');
      expect(style).toContain('#d5e8d4');
      expect(style).toContain('#82b366');
    });
  });

  describe('getStepTypeLabel', () => {
    it('should return correct labels for step types', () => {
      expect(service['getStepTypeLabel']('decision')).toBe('Decisão');
      expect(service['getStepTypeLabel']('parallel')).toBe('Paralelo');
      expect(service['getStepTypeLabel']('process')).toBe('Processo');
      expect(service['getStepTypeLabel']('unknown')).toBe('Processo');
    });
  });

  describe('downloadXml', () => {
    it('should create download link with correct filename', () => {
      const xml = '<?xml version="1.0"?><test>content</test>';
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
      const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();
      const clickSpy = jasmine.createSpy('click');
      
      // Mock the link element as a proper HTMLAnchorElement
      const mockLink = document.createElement('a');
      mockLink.click = clickSpy;
      
      createElementSpy.and.returnValue(mockLink);
      
      service.downloadXml(xml, 'test-file.drawio');
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test-file.drawio');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('should use default filename when not provided', () => {
      const xml = '<?xml version="1.0"?><test>content</test>';
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      
      const mockLink = document.createElement('a');
      mockLink.click = jasmine.createSpy('click');
      
      createElementSpy.and.returnValue(mockLink);
      
      service.downloadXml(xml);
      
      expect(mockLink.download).toBe('resources-manager-export.drawio');
    });
  });
});
