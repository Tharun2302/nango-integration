import { v4 as uuidv4 } from 'uuid';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecutionContext,
  ExecutionLog,
  NodeExecutionResult,
  NodeType,
} from '../types/workflow';
import { getExecutor } from '../executors';
import logger from '../utils/logger';

export class WorkflowEngine {
  async execute(
    workflow: Workflow,
    initialInput?: Record<string, unknown>
  ): Promise<WorkflowExecutionContext> {
    const context: WorkflowExecutionContext = {
      workflowId: workflow.id,
      executionId: uuidv4(),
      variables: { input: initialInput || {} },
      logs: [],
    };

    logger.info(`Starting workflow execution`, {
      workflowId: workflow.id,
      executionId: context.executionId,
    });

    const executionOrder = this.resolveExecutionOrder(workflow);

    for (const node of executionOrder) {
      const log = await this.executeNode(node, context, workflow.edges);
      context.logs.push(log);

      if (log.status === 'error') {
        logger.error(`Node execution failed, halting workflow`, {
          nodeId: node.id,
          error: log.error,
        });
        break;
      }

      context.variables[node.id] = log.output;
    }

    logger.info(`Workflow execution completed`, {
      workflowId: workflow.id,
      executionId: context.executionId,
      totalNodes: executionOrder.length,
      executedLogs: context.logs.length,
    });

    return context;
  }

  /**
   * Topological sort via Kahn's algorithm. Throws if the graph contains a cycle.
   */
  private resolveExecutionOrder(workflow: Workflow): WorkflowNode[] {
    const { nodes, edges } = workflow;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId);
    }

    const sorted: WorkflowNode[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodeMap.get(current);
      if (node) sorted.push(node);

      for (const neighbor of adjacency.get(current) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== nodes.length) {
      const missing = nodes
        .filter((n) => !sorted.find((s) => s.id === n.id))
        .map((n) => n.id);
      throw new Error(
        `Workflow contains a cycle involving nodes: ${missing.join(', ')}`
      );
    }

    return sorted;
  }

  private async executeNode(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    edges: WorkflowEdge[]
  ): Promise<ExecutionLog> {
    const startTime = Date.now();

    const nodeType = node.data?.type || node.type;

    const log: ExecutionLog = {
      nodeId: node.id,
      nodeType,
      status: 'running',
      timestamp: new Date().toISOString(),
    };

    try {
      const executor = getExecutor(nodeType as NodeType);
      const input = this.resolveNodeInput(node, context, edges);
      log.input = input;

      logger.info(`Executing node: ${node.data.label}`, {
        nodeId: node.id,
        type: nodeType,
      });

      const result: NodeExecutionResult = await executor.execute(
        node.data.config,
        input,
        context
      );

      log.status = result.success ? 'success' : 'error';
      log.output = result.output;
      log.error = result.error;
    } catch (error) {
      log.status = 'error';
      log.error = error instanceof Error ? error.message : 'Unknown error';
    }

    log.duration = Date.now() - startTime;
    return log;
  }

  /**
   * Resolves input for a node by collecting outputs from its direct upstream
   * parents (determined by edges), not just the last-executed node globally.
   */
  private resolveNodeInput(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    edges: WorkflowEdge[]
  ): Record<string, unknown> {
    const previousOutputs: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context.variables)) {
      if (key !== 'input') {
        previousOutputs[key] = value;
      }
    }

    const parentNodeIds = edges
      .filter((e) => e.target === node.id)
      .map((e) => e.source);

    let lastOutput: unknown = undefined;
    if (parentNodeIds.length > 0) {
      const parentId = parentNodeIds[parentNodeIds.length - 1];
      lastOutput = context.variables[parentId];
    } else if (context.logs.length > 0) {
      lastOutput = context.logs[context.logs.length - 1].output;
    }

    return {
      ...(context.variables.input as Record<string, unknown>),
      previousOutputs,
      lastOutput,
    };
  }
}
