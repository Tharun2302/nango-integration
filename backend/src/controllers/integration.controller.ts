import { Request, Response } from 'express';
import { nangoClient } from '../integrations/nango';
import logger from '../utils/logger';

const NANGO_API = process.env.NANGO_HOST || 'https://api.nango.dev';

function nangoHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NANGO_SECRET_KEY || ''}`,
  };
}

export async function listConnections(req: Request, res: Response) {
  try {
    const nango = nangoClient();
    const result = await nango.listConnections();
    const provider = req.query.provider as string | undefined;

    const connections = provider
      ? result.connections.filter(
          (c: { provider_config_key: string }) => c.provider_config_key === provider
        )
      : result.connections;

    res.json({ connections });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to list connections';
    logger.error('Failed to list Nango connections', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export async function listIntegrations(_req: Request, res: Response) {
  try {
    const nango = nangoClient();
    const result = await nango.listIntegrations();
    res.json({ integrations: result.configs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to list integrations';
    logger.error('Failed to list Nango integrations', { error: msg });
    res.status(500).json({ error: msg });
  }
}

function parseNangoError(text: string, fallback: string): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error?.errors?.length) {
      return parsed.error.errors.map((e: { message?: string }) => e.message).join(', ');
    }
    return parsed?.error?.message || parsed?.error?.code || parsed?.message || fallback;
  } catch {
    return text || fallback;
  }
}

function parseNangoBody(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { raw: text }; }
}

export async function createIntegration(req: Request, res: Response) {
  try {
    const { provider, uniqueKey, clientId, clientSecret, scopes } = req.body;

    if (!provider || !uniqueKey) {
      res.status(400).json({ error: 'provider and uniqueKey are required' });
      return;
    }

    const credentials: Record<string, unknown> | undefined =
      clientId && clientSecret
        ? { type: 'OAUTH2', client_id: clientId, client_secret: clientSecret, ...(scopes ? { scopes } : {}) }
        : undefined;

    // Try creating first
    const createBody: Record<string, unknown> = { provider, unique_key: uniqueKey };
    if (credentials) createBody.credentials = credentials;

    let response = await fetch(`${NANGO_API}/integrations`, {
      method: 'POST',
      headers: nangoHeaders(),
      body: JSON.stringify(createBody),
    });

    let responseText = await response.text();
    logger.info('Nango create response', { status: response.status, body: responseText.substring(0, 500) });

    // If already exists, fall back to PATCH to update credentials
    const alreadyExists = responseText.includes('already exists');
    if (!response.ok && alreadyExists && credentials) {
      logger.info('Integration exists, updating via PATCH', { uniqueKey });

      const patchBody: Record<string, unknown> = { credentials };
      response = await fetch(`${NANGO_API}/integrations/${encodeURIComponent(uniqueKey)}`, {
        method: 'PATCH',
        headers: nangoHeaders(),
        body: JSON.stringify(patchBody),
      });

      responseText = await response.text();
      logger.info('Nango patch response', { status: response.status, body: responseText.substring(0, 500) });
    }

    if (!response.ok) {
      throw new Error(parseNangoError(responseText, `Nango API error: ${response.status}`));
    }

    logger.info('Integration created/updated', { provider, uniqueKey });
    res.json({ success: true, integration: parseNangoBody(responseText) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create integration';
    logger.error('Failed to create integration', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export async function deleteIntegration(req: Request, res: Response) {
  try {
    const { uniqueKey } = req.params;

    const response = await fetch(`${NANGO_API}/integrations/${encodeURIComponent(uniqueKey)}`, {
      method: 'DELETE',
      headers: nangoHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      const errBody = await response.text();
      let errorMsg = `Nango API error: ${response.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errorMsg = parsed?.error?.message || parsed?.error?.code || errorMsg;
      } catch {
        if (errBody) errorMsg = errBody;
      }
      throw new Error(errorMsg);
    }

    logger.info('Integration deleted', { uniqueKey });
    res.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete integration';
    logger.error('Failed to delete integration', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export async function getAvailableProviders(_req: Request, res: Response) {
  try {
    const response = await fetch(`${NANGO_API}/providers`, {
      headers: nangoHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Nango API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch providers';
    logger.error('Failed to fetch Nango providers', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export async function createConnectSession(req: Request, res: Response) {
  try {
    const { endUser } = req.body;

    if (!endUser?.id) {
      res.status(400).json({ error: 'endUser.id is required' });
      return;
    }

    const nango = nangoClient();
    const session = await nango.createConnectSession({
      end_user: {
        id: endUser.id,
        email: endUser.email,
        display_name: endUser.displayName,
      },
    });

    res.json({ token: session.data.token, expiresAt: session.data.expires_at });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create connect session';
    logger.error('Failed to create Nango connect session', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export async function getConnection(req: Request, res: Response) {
  try {
    const { provider, connectionId } = req.params;
    const nango = nangoClient();
    const connection = await nango.getConnection(provider, connectionId);
    res.json({ connection });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get connection';
    logger.error('Failed to get Nango connection', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export async function deleteConnection(req: Request, res: Response) {
  try {
    const { provider, connectionId } = req.params;
    const nango = nangoClient();
    await nango.deleteConnection(provider, connectionId);
    res.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete connection';
    logger.error('Failed to delete Nango connection', { error: msg });
    res.status(500).json({ error: msg });
  }
}

export function getNangoConfig(_req: Request, res: Response) {
  const publicKey = process.env.NANGO_PUBLIC_KEY || process.env.NANGO_SECRET_KEY || '';
  const host = process.env.NANGO_HOST || 'https://api.nango.dev';
  const providerKeys = {
    slack: process.env.NANGO_SLACK_KEY || 'slack',
    'google-sheets': process.env.NANGO_GSHEET_KEY || 'google-sheets',
  };
  res.json({ publicKey, host, providerKeys });
}
