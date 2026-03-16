const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

export const workflowApi = {
  save: (data: Record<string, unknown>) =>
    request<{ success: boolean; workflow: { id: string; name: string } }>('/workflow/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    request<{ workflow: Record<string, unknown> }>(`/workflow/${id}`),

  list: () =>
    request<{ workflows: Record<string, unknown>[] }>('/workflow/list'),

  run: (id: string, input?: Record<string, unknown>) =>
    request<{ success: boolean; execution: Record<string, unknown> }>(`/workflow/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/workflow/${id}`, { method: 'DELETE' }),
};
