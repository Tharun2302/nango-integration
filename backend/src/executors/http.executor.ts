import { NodeExecutor } from './base.executor';
import {
  NodeExecutionResult,
  WorkflowExecutionContext,
} from '../types/workflow';
import logger from '../utils/logger';

export class HttpExecutor implements NodeExecutor {
  async execute(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    _context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const method = ((config.method as string) || 'GET').toUpperCase();
    const url = this.interpolate((config.url as string) || '', input);
    const headers = (config.headers as Record<string, string>) || {};
    const body = config.body ? this.resolveBody(config.body, input) : undefined;

    if (!url) {
      return { success: false, output: null, error: 'Missing URL in HTTP config' };
    }

    logger.info('HTTP request executing', { method, url });

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      };

      if (body && !['GET', 'HEAD'].includes(method)) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      return {
        success: response.ok,
        output: {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
        },
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'HTTP request failed';
      logger.error('HTTP execution failed', { error: message });
      return { success: false, output: null, error: message };
    }
  }

  private interpolate(
    template: string,
    input: Record<string, unknown>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = input[key];
      return value != null ? String(value) : `{{${key}}}`;
    });
  }

  private resolveBody(
    body: unknown,
    input: Record<string, unknown>
  ): unknown {
    if (typeof body === 'string') {
      return this.interpolate(body, input);
    }
    return body;
  }
}
