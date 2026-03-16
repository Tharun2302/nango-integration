import { NodeExecutor } from './base.executor';
import {
  NodeExecutionResult,
  WorkflowExecutionContext,
} from '../types/workflow';
import { nangoClient } from '../integrations/nango';
import logger from '../utils/logger';

export class SlackExecutor implements NodeExecutor {
  async execute(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    _context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const connectionId = config.connectionId as string;
    const channel = config.channel as string;
    const messageTemplate = config.messageTemplate as string;

    if (!connectionId || !channel) {
      logger.info('Slack node skipped: missing connectionId or channel');
      return {
        success: true,
        output: {
          skipped: true,
          reason: 'Slack not configured — add a connection ID and channel to enable',
          passthrough: input.lastOutput,
        },
      };
    }

    const message = this.interpolateMessage(messageTemplate, input);

    logger.info('Sending Slack message', { channel, connectionId });

    try {
      const nango = nangoClient();

      const response = await nango.proxy({
        method: 'POST',
        endpoint: '/chat.postMessage',
        providerConfigKey: (config.providerConfigKey as string) || process.env.NANGO_SLACK_KEY || 'slack',
        connectionId,
        data: { channel, text: message },
      });

      return {
        success: true,
        output: {
          channel,
          message,
          response: response.data,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Slack API call failed';
      logger.error('Slack execution failed', { error: message });
      return { success: false, output: null, error: message };
    }
  }

  private interpolateMessage(
    template: string,
    input: Record<string, unknown>
  ): string {
    if (!template) {
      const lastOutput = input.lastOutput;
      if (
        lastOutput &&
        typeof lastOutput === 'object' &&
        'message' in (lastOutput as Record<string, unknown>)
      ) {
        return (lastOutput as Record<string, string>).message;
      }
      return JSON.stringify(input.lastOutput || input);
    }

    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const keys = path.split('.');
      let value: unknown = input;
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[key];
        } else {
          return `{{${path}}}`;
        }
      }
      return typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
}
