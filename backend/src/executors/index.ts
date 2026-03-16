import { NodeType } from '../types/workflow';
import { NodeExecutor } from './base.executor';
import { TriggerExecutor } from './trigger.executor';
import { AIAgentExecutor } from './aiAgent.executor';
import { SlackExecutor } from './slack.executor';
import { GoogleSheetsExecutor } from './googleSheets.executor';
import { HttpExecutor } from './http.executor';

const executors: Record<NodeType, NodeExecutor> = {
  trigger: new TriggerExecutor(),
  aiAgent: new AIAgentExecutor(),
  slack: new SlackExecutor(),
  googleSheets: new GoogleSheetsExecutor(),
  httpRequest: new HttpExecutor(),
};

export function getExecutor(type: NodeType): NodeExecutor {
  const executor = executors[type];
  if (!executor) {
    throw new Error(`No executor registered for node type: ${type}`);
  }
  return executor;
}

/**
 * Register a custom executor at runtime, enabling extensibility.
 */
export function registerExecutor(type: string, executor: NodeExecutor): void {
  (executors as Record<string, NodeExecutor>)[type] = executor;
}
