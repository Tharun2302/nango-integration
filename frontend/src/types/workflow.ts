import { Node, Edge } from 'reactflow';

export type NodeType =
  | 'trigger'
  | 'aiAgent'
  | 'slack'
  | 'googleSheets'
  | 'httpRequest';

export interface NodeConfig {
  [key: string]: unknown;
}

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: NodeConfig;
  icon?: string;
  color?: string;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultConfig: NodeConfig;
}

export const NODE_TYPE_DEFINITIONS: NodeTypeDefinition[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start the workflow',
    icon: 'Zap',
    color: '#f59e0b',
    defaultConfig: { triggerType: 'manual', payload: {} },
  },
  {
    type: 'aiAgent',
    label: 'AI Agent',
    description: 'Process with AI',
    icon: 'Brain',
    color: '#8b5cf6',
    defaultConfig: {
      model: 'gpt-4o-mini',
      systemPrompt: 'You are a helpful automation assistant. Generate clear, concise, professional responses. Output only the final result, no explanations.',
      userPrompt: 'Generate a welcome message for a new customer who just signed up.',
      temperature: 0.7,
      maxTokens: 256,
    },
  },
  {
    type: 'slack',
    label: 'Slack',
    description: 'Send a Slack message',
    icon: 'MessageSquare',
    color: '#4ade80',
    defaultConfig: { connectionId: '', channel: '', messageTemplate: '' },
  },
  {
    type: 'googleSheets',
    label: 'Google Sheets',
    description: 'Write to spreadsheet',
    icon: 'Sheet',
    color: '#34d399',
    defaultConfig: {
      connectionId: '',
      spreadsheetId: '',
      sheetName: 'Sheet1',
      range: 'A1',
      values: [],
    },
  },
  {
    type: 'httpRequest',
    label: 'HTTP Request',
    description: 'Make an HTTP call',
    icon: 'Globe',
    color: '#60a5fa',
    defaultConfig: { method: 'GET', url: '', headers: {}, body: null },
  },
];
