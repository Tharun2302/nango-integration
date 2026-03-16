import { useState, useEffect, useCallback } from 'react';
import { Link2, Plus, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Nango from '@nangohq/frontend';
import { integrationApi, NangoConnection } from '../../services/integrationApi';

interface ConnectionPickerProps {
  provider: string;
  value: string;
  onChange: (connectionId: string) => void;
}

export function ConnectionPicker({ provider, value, onChange }: ConnectionPickerProps) {
  const [connections, setConnections] = useState<NangoConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

  const resolveProviderKey = useCallback(async (): Promise<string> => {
    try {
      const config = await integrationApi.getConfig();
      return config.providerKeys?.[provider] || provider;
    } catch {
      return provider;
    }
  }, [provider]);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const providerKey = await resolveProviderKey();
      const result = await integrationApi.listConnections(providerKey);
      setConnections(result.connections);

      if (result.connections.length > 0 && !value) {
        onChange(result.connections[0].connection_id);
      }
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [provider, value, onChange, resolveProviderKey]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setStatus(null);
    try {
      const config = await integrationApi.getConfig();
      const providerKey = config.providerKeys?.[provider] || provider;
      const connectionId = `user-${provider}-${Date.now()}`;

      if (config.publicKey) {
        const nango = new Nango({ publicKey: config.publicKey, host: config.host });
        await nango.auth(providerKey, connectionId);
      } else {
        const session = await integrationApi.createConnectSession({
          id: `workflow-user-${Date.now()}`,
          email: 'user@workflow-builder.local',
          displayName: 'Workflow Builder User',
        });

        const nango = new Nango();
        const connectUI = nango.openConnectUI({ sessionToken: session.token });

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => { connectUI.close(); reject(new Error('Connection timed out')); }, 120000);
          const originalOnEvent = connectUI['onEvent'];
          connectUI['onEvent'] = (event: { type: string }) => {
            if (originalOnEvent) (originalOnEvent as (e: unknown) => void)(event);
            if (event.type === 'connect') { clearTimeout(timeout); resolve(); }
            if (event.type === 'close') { clearTimeout(timeout); reject(new Error('Connection cancelled')); }
          };
        });
      }

      setStatus({ text: `Connected to ${provider}!`, isError: false });
      onChange(connectionId);
      await fetchConnections();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      if (msg.includes('resource_capped') || msg.includes('maximum')) {
        setStatus({ text: 'Connection limit reached. Use an existing connection or upgrade your Nango plan.', isError: true });
      } else if (msg !== 'Connection cancelled') {
        setStatus({ text: msg, isError: true });
      }
    } finally {
      setConnecting(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }, [provider, onChange, fetchConnections]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {loading ? (
            <div className="input-field flex items-center gap-2 text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          ) : connections.length > 0 ? (
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="input-field"
            >
              <option value="">Select a connection...</option>
              {connections.map((conn) => (
                <option key={conn.connection_id} value={conn.connection_id}>
                  {conn.connection_id}
                </option>
              ))}
            </select>
          ) : (
            <div className="input-field flex items-center gap-2 text-gray-500 text-xs">
              <XCircle size={14} />
              No {provider} connections found
            </div>
          )}
        </div>

        <button
          onClick={fetchConnections}
          disabled={loading}
          title="Refresh connections"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-surface-light transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="
          w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium
          rounded-lg border border-dashed border-border
          text-accent-light hover:border-accent/50 hover:bg-accent/5
          disabled:opacity-50 transition-all
        "
      >
        {connecting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Plus size={14} />
        )}
        Connect new {provider} account
      </button>

      <div className="pt-1">
        <label className="block text-[10px] text-gray-600 mb-1">
          Or enter connection ID manually:
        </label>
        <div className="flex items-center gap-2">
          <Link2 size={12} className="text-gray-600 shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`e.g. user-${provider}`}
            className="input-field text-xs"
          />
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-1.5 text-xs mt-1 ${status.isError ? 'text-red-400' : 'text-green-400'}`}>
          {status.isError ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
          {status.text}
        </div>
      )}
    </div>
  );
}
