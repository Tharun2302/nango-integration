import { NodeExecutor } from './base.executor';
import {
  NodeExecutionResult,
  WorkflowExecutionContext,
} from '../types/workflow';
import { nangoClient } from '../integrations/nango';
import logger from '../utils/logger';

export class GoogleSheetsExecutor implements NodeExecutor {
  async execute(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    _context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const connectionId = config.connectionId as string;
    const spreadsheetId = config.spreadsheetId as string;
    const sheetName = (config.sheetName as string) || 'Sheet1';
    const range = (config.range as string) || 'A1';
    const valueTemplates = (config.values as string[]) || [];

    if (!connectionId) {
      logger.info('Google Sheets node skipped: missing connectionId');
      return this.buildPreviewOutput(input, sheetName, range, 'No connection configured');
    }

    const aiOutput = input.lastOutput as Record<string, unknown> | undefined;
    const aiMessage = aiOutput && typeof aiOutput === 'object' && typeof aiOutput.message === 'string'
      ? aiOutput.message
      : '';

    let values: string[];
    if (valueTemplates.length > 0) {
      values = valueTemplates.map((tpl) => this.interpolateValue(tpl, input));
    } else {
      values = [
        new Date().toISOString(),
        'AI Generated',
        aiMessage || JSON.stringify(input.lastOutput),
        'Completed',
      ];
    }

    const providerConfigKey = (config.providerConfigKey as string) || process.env.NANGO_GSHEET_KEY || 'google-sheets';

    if (!spreadsheetId) {
      logger.info('Google Sheets node: no spreadsheet ID, creating one automatically');
      try {
        const nango = nangoClient();

        const createRes = await nango.proxy({
          method: 'POST',
          endpoint: '/v4/spreadsheets',
          providerConfigKey,
          connectionId,
          data: {
            properties: { title: `AI Workflow - ${new Date().toLocaleDateString()}` },
            sheets: [{ properties: { title: sheetName } }],
          },
        });

        const newSpreadsheetId = createRes.data.spreadsheetId as string;
        const spreadsheetUrl = createRes.data.spreadsheetUrl as string;

        await nango.proxy({
          method: 'POST',
          endpoint: `/v4/spreadsheets/${newSpreadsheetId}/values/${sheetName}!${range}:append`,
          providerConfigKey,
          connectionId,
          params: {
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
          },
          data: {
            range: `${sheetName}!${range}`,
            majorDimension: 'ROWS',
            values: [
              ['Timestamp', 'Type', 'Message', 'Status'],
              values,
            ],
          },
        });

        logger.info('Google Sheets: created spreadsheet and wrote data', { newSpreadsheetId });

        return {
          success: true,
          output: {
            spreadsheetId: newSpreadsheetId,
            spreadsheetUrl,
            sheetName,
            range,
            sheetPreview: {
              headers: ['Timestamp', 'Type', 'Message', 'Status'],
              rows: [values],
            },
            written: true,
            message: `Data written to new spreadsheet`,
          },
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to create spreadsheet';
        logger.error('Google Sheets auto-create failed', { error: msg });
        return this.buildPreviewOutput(input, sheetName, range, msg);
      }
    }

    logger.info('Writing to Google Sheets', { spreadsheetId, sheetName, range });

    try {
      const nango = nangoClient();

      const response = await nango.proxy({
        method: 'POST',
        endpoint: `/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}:append`,
        providerConfigKey,
        connectionId,
        params: {
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
        },
        data: {
          range: `${sheetName}!${range}`,
          majorDimension: 'ROWS',
          values: [values],
        },
      });

      return {
        success: true,
        output: {
          spreadsheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          sheetName,
          range,
          sheetPreview: {
            headers: ['Timestamp', 'Type', 'Message', 'Status'],
            rows: [values],
          },
          written: true,
          message: 'Data written successfully',
          apiResponse: response.data,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google Sheets API call failed';
      logger.error('Google Sheets execution failed', { error: msg });
      return { success: false, output: null, error: msg };
    }
  }

  private buildPreviewOutput(
    input: Record<string, unknown>,
    sheetName: string,
    range: string,
    reason: string,
  ): NodeExecutionResult {
    const aiOutput = input.lastOutput as Record<string, unknown> | undefined;
    const message = aiOutput && typeof aiOutput === 'object' && typeof aiOutput.message === 'string'
      ? aiOutput.message
      : JSON.stringify(input.lastOutput);

    return {
      success: true,
      output: {
        skipped: true,
        reason,
        sheetPreview: {
          headers: ['Timestamp', 'Type', 'Message', 'Status'],
          rows: [[new Date().toISOString(), 'AI Generated', message, 'Ready to write']],
        },
        sheetName,
        range,
      },
    };
  }

  private interpolateValue(
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
      return typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
}
