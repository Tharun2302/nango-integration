export type NodeType =
  | 'trigger'
  | 'aiAgent'
  | 'slack'
  | 'googleSheets'
  | 'httpRequest';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  type: NodeType;
  config: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, unknown>;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  nodeId: string;
  nodeType: NodeType;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
  timestamp: string;
  duration?: number;
}

export interface NodeExecutionResult {
  success: boolean;
  output: unknown;
  error?: string;
}

export interface TriggerConfig {
  triggerType: 'manual' | 'webhook' | 'schedule';
  payload?: Record<string, unknown>;
}

export interface AIAgentConfig {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SlackConfig {
  connectionId: string;
  channel: string;
  messageTemplate: string;
}

export interface GoogleSheetsConfig {
  connectionId: string;
  spreadsheetId: string;
  sheetName: string;
  range: string;
  values: string[];
}

export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}
