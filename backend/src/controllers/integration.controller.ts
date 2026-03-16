import { Request, Response } from 'express';
import { nangoClient } from '../integrations/nango';
import logger from '../utils/logger';

/**
 * Lists all available Nango connections, optionally filtered by provider.
 */
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

/**
 * Lists all configured integrations in Nango.
 */
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

/**
 * Creates a Nango Connect session so the frontend can trigger the OAuth flow.
 */
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

/**
 * Gets details for a specific connection.
 */
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

/**
 * Deletes a specific connection.
 */
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

/**
 * Returns the Nango public key for the frontend connect flow.
 */
export function getNangoConfig(_req: Request, res: Response) {
  const publicKey = process.env.NANGO_PUBLIC_KEY || process.env.NANGO_SECRET_KEY || '';
  const host = process.env.NANGO_HOST || 'https://api.nango.dev';
  const providerKeys = {
    slack: process.env.NANGO_SLACK_KEY || 'slack',
    'google-sheets': process.env.NANGO_GSHEET_KEY || 'google-sheets',
  };
  res.json({ publicKey, host, providerKeys });
}
