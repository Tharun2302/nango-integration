const API_BASE = '/api/integrations';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export interface NangoConnection {
  id: number;
  connection_id: string;
  provider_config_key: string;
  provider: string;
  created: string;
  metadata: Record<string, unknown> | null;
}

export interface NangoIntegration {
  unique_key: string;
  provider: string;
}

export interface NangoConfig {
  publicKey: string;
  host: string;
  providerKeys: Record<string, string>;
}

export const integrationApi = {
  getConfig: () =>
    request<NangoConfig>('/config'),

  listIntegrations: () =>
    request<{ integrations: NangoIntegration[] }>('/integrations'),

  listConnections: (provider?: string) => {
    const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    return request<{ connections: NangoConnection[] }>(`/connections${query}`);
  },

  createConnectSession: (endUser: { id: string; email?: string; displayName?: string }) =>
    request<{ token: string; expiresAt: string }>('/connect-session', {
      method: 'POST',
      body: JSON.stringify({ endUser }),
    }),

  getConnection: (provider: string, connectionId: string) =>
    request<{ connection: Record<string, unknown> }>(`/connections/${provider}/${connectionId}`),

  deleteConnection: (provider: string, connectionId: string) =>
    request<{ success: boolean }>(`/connections/${provider}/${connectionId}`, {
      method: 'DELETE',
    }),
};
