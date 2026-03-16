import { NodeExecutor } from './base.executor';
import {
  NodeExecutionResult,
  WorkflowExecutionContext,
} from '../types/workflow';
import logger from '../utils/logger';

export class TriggerExecutor implements NodeExecutor {
  async execute(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    _context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    logger.info('Trigger node executed', { triggerType: config.triggerType });

    const payload = config.payload || input;

    return {
      success: true,
      output: {
        triggered: true,
        triggerType: config.triggerType || 'manual',
        payload,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
