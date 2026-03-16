import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import {
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  NODE_TYPE_DEFINITIONS,
} from '../types/workflow';

interface WorkflowState {
  workflowId: string | null;
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isPanelOpen: boolean;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  togglePanel: () => void;
  setWorkflowId: (id: string) => void;
  setWorkflowName: (name: string) => void;
  loadWorkflow: (data: {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => void;
  clearWorkflow: () => void;
  toJSON: () => {
    id: string | null;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}

let nodeCounter = 0;
function generateId(): string {
  nodeCounter += 1;
  return `node_${Date.now()}_${nodeCounter}`;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isPanelOpen: false,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) });
  },

  addNode: (type, position) => {
    const definition = NODE_TYPE_DEFINITIONS.find((d) => d.type === type);
    if (!definition) return;

    const newNode: WorkflowNode = {
      id: generateId(),
      type: 'workflowNode',
      position,
      data: {
        label: definition.label,
        type,
        config: { ...definition.defaultConfig },
        icon: definition.icon,
        color: definition.color,
      },
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node
      ),
    });
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label } }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, isPanelOpen: nodeId !== null });
  },

  togglePanel: () => {
    set({ isPanelOpen: !get().isPanelOpen });
  },

  setWorkflowId: (id) => {
    set({ workflowId: id });
  },

  setWorkflowName: (name) => {
    set({ workflowName: name });
  },

  loadWorkflow: (data) => {
    set({
      workflowId: data.id,
      workflowName: data.name,
      nodes: data.nodes,
      edges: data.edges,
      selectedNodeId: null,
      isPanelOpen: false,
    });
  },

  clearWorkflow: () => {
    set({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isPanelOpen: false,
    });
  },

  toJSON: () => {
    const { workflowId, workflowName, nodes, edges } = get();
    return { id: workflowId, name: workflowName, nodes, edges };
  },
}));
