export interface Position {
  x: number;
  y: number;
}

export interface NodeProperties {
  standardProps: { [key: string]: any };
  customProps: { [key: string]: any };
}

export interface Node {
  id: string;
  name: string;
  description: string;
  workflows: string[];
  properties: NodeProperties;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  id: string;
  type: 'decision' | 'parallel' | 'process' | 'conditional';
  name: string;
  description: string;
  workflows: string[];
  connections: Connection[];
  properties: { [key: string]: any };
  decisionStepId?: string; // Para etapas condicionais associadas a decisões
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  targetNodeId: string;
}

export interface NodeStandardProperty {
  key: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean';
  options?: string[];
  required: boolean;
  default: any;
}

export interface StandardProperties {
  version: string;
  properties: NodeStandardProperty[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StandardProperty {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select';
  options: string[];
  required: boolean;
  defaultValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workflows {
  version: string;
  workflows: Workflow[];
}

export interface SearchResult {
  type: 'node' | 'step';
  id: string;
  name: string;
  description: string;
  workflows: string[];
  nodeId?: string;
  nodeName?: string;
  properties?: { [key: string]: any };
  steps?: SearchResultStep[];
  hasMatchingSteps?: boolean;
  stepType?: string;
  connections?: Connection[];
}

export interface SearchResultStep {
  type: 'step';
  id: string;
  name: string;
  description: string;
  stepType: string;
  nodeId: string;
  nodeName: string;
  workflows: string[];
  connections: Connection[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  query?: string;
  workflow?: string;
}
