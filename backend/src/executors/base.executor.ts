import {
  NodeExecutionResult,
  WorkflowExecutionContext,
} from '../types/workflow';

export interface NodeExecutor {
  execute(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult>;
}
