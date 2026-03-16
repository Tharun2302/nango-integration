import { Nango } from '@nangohq/node';
import logger from '../utils/logger';

let instance: Nango | null = null;

/**
 * Singleton Nango client. Requires NANGO_SECRET_KEY env var.
 */
export function nangoClient(): Nango {
  if (!instance) {
    const secretKey = process.env.NANGO_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        'NANGO_SECRET_KEY is not set. Configure it in your .env file.'
      );
    }

    instance = new Nango({ secretKey });
    logger.info('Nango client initialized');
  }

  return instance;
}

/**
 * Lists available Nango connections for a given provider.
 */
export async function listConnections(providerConfigKey: string) {
  const nango = nangoClient();
  const connections = await nango.listConnections();
  return connections.connections.filter(
    (c: { provider_config_key: string }) => c.provider_config_key === providerConfigKey
  );
}
