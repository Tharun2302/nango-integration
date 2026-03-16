import OpenAI from 'openai';
import { NodeExecutor } from './base.executor';
import {
  NodeExecutionResult,
  WorkflowExecutionContext,
} from '../types/workflow';
import logger from '../utils/logger';

export class AIAgentExecutor implements NodeExecutor {
  private openai: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this.openai;
  }

  async execute(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    _context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const model = (config.model as string) || 'gpt-4o-mini';
    const systemPrompt =
      (config.systemPrompt as string) || 'You are a helpful assistant.';
    const userPrompt = this.interpolateTemplate(
      (config.userPrompt as string) || '{{lastOutput}}',
      input
    );
    const temperature = (config.temperature as number) ?? 0.7;
    const maxTokens = (config.maxTokens as number) ?? 1024;

    logger.info('AI Agent executing', { model, temperature });

    try {
      const response = await this.getClient().chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        success: true,
        output: {
          message: content,
          model,
          usage: response.usage,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OpenAI API call failed';
      logger.error('AI Agent execution failed', { error: message });
      return { success: false, output: null, error: message };
    }
  }

  /**
   * Replaces {{key}} and {{key.nested.path}} placeholders with values from input.
   */
  private interpolateTemplate(
    template: string,
    input: Record<string, unknown>
  ): string {
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
      if (value === undefined || value === null) return `{{${path}}}`;
      return typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
}
