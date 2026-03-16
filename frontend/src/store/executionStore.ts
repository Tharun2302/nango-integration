import { create } from 'zustand';

export interface ExecutionLog {
  nodeId: string;
  nodeType: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
  timestamp: string;
  duration?: number;
}

export interface ExecutionResult {
  workflowId: string;
  executionId: string;
  logs: ExecutionLog[];
  variables: Record<string, unknown>;
}

interface ExecutionState {
  isRunning: boolean;
  lastExecution: ExecutionResult | null;
  showResults: boolean;
  nodeStatuses: Record<string, 'success' | 'error'>;

  setRunning: (running: boolean) => void;
  setExecution: (result: ExecutionResult) => void;
  toggleResults: () => void;
  closeResults: () => void;
  clearExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  isRunning: false,
  lastExecution: null,
  showResults: false,
  nodeStatuses: {},

  setRunning: (running) => set({ isRunning: running }),

  setExecution: (result) => {
    const nodeStatuses: Record<string, 'success' | 'error'> = {};
    for (const log of result.logs) {
      nodeStatuses[log.nodeId] = log.status === 'success' ? 'success' : 'error';
    }
    set({
      lastExecution: result,
      showResults: true,
      isRunning: false,
      nodeStatuses,
    });
  },

  toggleResults: () => set((s) => ({ showResults: !s.showResults })),
  closeResults: () => set({ showResults: false }),
  clearExecution: () => set({ lastExecution: null, showResults: false, nodeStatuses: {} }),
}));
