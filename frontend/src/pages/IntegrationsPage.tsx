import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, Link2, RefreshCw, CheckCircle2,
  XCircle, Loader2, ArrowLeft, ExternalLink, X, Eye, EyeOff,
  Plug, Shield, AlertTriangle,
} from 'lucide-react';
import Nango from '@nangohq/frontend';
import {
  integrationApi,
  NangoIntegration,
  NangoConnection,
  CreateIntegrationPayload,
} from '../services/integrationApi';

const POPULAR_PROVIDERS = [
  { id: 'slack', name: 'Slack', icon: '💬', category: 'Communication', authMode: 'OAUTH2' },
  { id: 'google-sheets', name: 'Google Sheets', icon: '📊', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'notion', name: 'Notion', icon: '📝', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'github', name: 'GitHub', icon: '🐙', category: 'Development', authMode: 'OAUTH2' },
  { id: 'jira', name: 'Jira', icon: '📋', category: 'Project Management', authMode: 'OAUTH2' },
  { id: 'hubspot', name: 'HubSpot', icon: '🟠', category: 'CRM', authMode: 'OAUTH2' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', category: 'CRM', authMode: 'OAUTH2' },
  { id: 'airtable', name: 'Airtable', icon: '📦', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'discord', name: 'Discord', icon: '🎮', category: 'Communication', authMode: 'OAUTH2' },
  { id: 'linear', name: 'Linear', icon: '📐', category: 'Project Management', authMode: 'OAUTH2' },
  { id: 'asana', name: 'Asana', icon: '✅', category: 'Project Management', authMode: 'OAUTH2' },
  { id: 'trello', name: 'Trello', icon: '📌', category: 'Project Management', authMode: 'OAUTH2' },
  { id: 'gmail', name: 'Gmail', icon: '📧', category: 'Communication', authMode: 'OAUTH2' },
  { id: 'google-calendar', name: 'Google Calendar', icon: '📅', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'google-drive', name: 'Google Drive', icon: '📁', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'dropbox', name: 'Dropbox', icon: '💧', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'microsoft-teams', name: 'Microsoft Teams', icon: '👥', category: 'Communication', authMode: 'OAUTH2' },
  { id: 'zendesk', name: 'Zendesk', icon: '🎫', category: 'Support', authMode: 'OAUTH2' },
  { id: 'intercom', name: 'Intercom', icon: '💬', category: 'Support', authMode: 'OAUTH2' },
  { id: 'shopify', name: 'Shopify', icon: '🛍️', category: 'E-commerce', authMode: 'OAUTH2' },
  { id: 'stripe', name: 'Stripe', icon: '💳', category: 'Payments', authMode: 'OAUTH2' },
  { id: 'twilio', name: 'Twilio', icon: '📞', category: 'Communication', authMode: 'OAUTH2' },
  { id: 'sendgrid', name: 'SendGrid', icon: '✉️', category: 'Communication', authMode: 'OAUTH2' },
  { id: 'mailchimp', name: 'Mailchimp', icon: '🐵', category: 'Marketing', authMode: 'OAUTH2' },
  { id: 'confluence', name: 'Confluence', icon: '📖', category: 'Productivity', authMode: 'OAUTH2' },
  { id: 'bitbucket', name: 'Bitbucket', icon: '🪣', category: 'Development', authMode: 'OAUTH2' },
  { id: 'gitlab', name: 'GitLab', icon: '🦊', category: 'Development', authMode: 'OAUTH2' },
  { id: 'figma', name: 'Figma', icon: '🎨', category: 'Design', authMode: 'OAUTH2' },
];

interface IntegrationsPageProps {
  onBack: () => void;
}

type ModalView = 'none' | 'add-integration' | 'manage-connection';

export function IntegrationsPage({ onBack }: IntegrationsPageProps) {
  const [integrations, setIntegrations] = useState<NangoIntegration[]>([]);
  const [connections, setConnections] = useState<NangoConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalView, setModalView] = useState<ModalView>('none');
  const [selectedProvider, setSelectedProvider] = useState<typeof POPULAR_PROVIDERS[0] | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<NangoIntegration | null>(null);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

  const showStatus = useCallback((text: string, isError = false) => {
    setStatus({ text, isError });
    setTimeout(() => setStatus(null), 5000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [intResult, connResult] = await Promise.all([
        integrationApi.listIntegrations(),
        integrationApi.listConnections(),
      ]);
      setIntegrations(intResult.integrations || []);
      setConnections(connResult.connections || []);
    } catch (err) {
      showStatus(
        `Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`,
        true,
      );
    } finally {
      setLoading(false);
    }
  }, [showStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getConnectionsForIntegration = (uniqueKey: string) =>
    connections.filter((c) => c.provider_config_key === uniqueKey);

  const configuredProviderKeys = new Set(integrations.map((i) => i.provider));

  const filteredProviders = POPULAR_PROVIDERS.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleAddClick = (provider: typeof POPULAR_PROVIDERS[0]) => {
    setSelectedProvider(provider);
    setModalView('add-integration');
  };

  const handleManageClick = (integration: NangoIntegration) => {
    setSelectedIntegration(integration);
    setModalView('manage-connection');
  };

  const handleCloseModal = () => {
    setModalView('none');
    setSelectedProvider(null);
    setSelectedIntegration(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plug size={20} className="text-accent" />
            Integrations
          </h1>
          <p className="text-xs text-gray-500">
            Add and manage third-party integrations via Nango
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-light border border-border hover:border-accent/50 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status toast */}
      {status && (
        <div
          className={`mx-6 mt-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
            status.isError
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}
        >
          {status.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {status.text}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Configured Integrations */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            Configured Integrations ({integrations.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : integrations.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <Plug size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No integrations configured yet</p>
              <p className="text-gray-600 text-xs mt-1">
                Search and add an integration below to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {integrations.map((integration) => {
                const providerInfo = POPULAR_PROVIDERS.find(
                  (p) => p.id === integration.provider,
                );
                const conns = getConnectionsForIntegration(integration.unique_key);

                return (
                  <div
                    key={integration.unique_key}
                    className="bg-surface border border-border rounded-xl p-4 hover:border-accent/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {integration.logo ? (
                          <img src={integration.logo} alt={integration.display_name || integration.provider} className="w-7 h-7 rounded" />
                        ) : (
                          <span className="text-2xl">{providerInfo?.icon || '🔗'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {integration.display_name || providerInfo?.name || integration.provider}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-mono truncate">
                          {integration.unique_key}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleManageClick(integration)}
                          className="p-1.5 rounded-lg text-accent-light hover:bg-accent/10 transition-all"
                          title="Manage connections"
                        >
                          <Link2 size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                `Delete integration "${integration.unique_key}"? This will also remove all its connections.`,
                              )
                            )
                              return;
                            try {
                              await integrationApi.deleteIntegration(
                                integration.unique_key,
                              );
                              showStatus('Integration deleted');
                              loadData();
                            } catch (err) {
                              showStatus(
                                `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                                true,
                              );
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete integration"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        {conns.length} connection{conns.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => handleManageClick(integration)}
                        className="text-[11px] text-accent-light hover:text-accent font-medium transition-all"
                      >
                        Connect Account →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Search and Add */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Plus size={16} className="text-accent" />
            Add New Integration
          </h2>

          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations... (Slack, Google Sheets, Jira, Notion, etc.)"
              className="input-field pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProviders.map((provider) => {
              const isConfigured = configuredProviderKeys.has(provider.id);

              return (
                <button
                  key={provider.id}
                  onClick={() => !isConfigured && handleAddClick(provider)}
                  disabled={isConfigured}
                  className={`relative bg-surface border rounded-xl p-4 text-left transition-all group ${
                    isConfigured
                      ? 'border-green-500/30 opacity-70 cursor-default'
                      : 'border-border hover:border-accent/50 hover:bg-surface-light cursor-pointer'
                  }`}
                >
                  {isConfigured && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={14} className="text-green-400" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{provider.icon}</div>
                  <h3 className="text-sm font-medium text-white">{provider.name}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{provider.category}</p>

                  {!isConfigured && (
                    <div className="mt-2 text-[10px] text-accent-light opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to add →
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No integrations found for "{searchQuery}"
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {modalView === 'add-integration' && selectedProvider && (
        <AddIntegrationModal
          provider={selectedProvider}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            showStatus(`${selectedProvider.name} integration added successfully!`);
            loadData();
          }}
          onError={(msg) => showStatus(msg, true)}
        />
      )}

      {modalView === 'manage-connection' && selectedIntegration && (
        <ManageConnectionModal
          integration={selectedIntegration}
          connections={getConnectionsForIntegration(selectedIntegration.unique_key)}
          onClose={handleCloseModal}
          onRefresh={loadData}
          onStatus={showStatus}
        />
      )}
    </div>
  );
}

/* ─────────── Add Integration Modal ─────────── */

function AddIntegrationModal({
  provider,
  onClose,
  onSuccess,
  onError,
}: {
  provider: typeof POPULAR_PROVIDERS[0];
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scopes, setScopes] = useState('');
  const [uniqueKey, setUniqueKey] = useState(provider.id);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    setFormError('');

    if (!uniqueKey.trim()) {
      setFormError('Integration key is required');
      return;
    }
    if (!clientId.trim()) {
      setFormError('Client ID is required');
      return;
    }
    if (!clientSecret.trim()) {
      setFormError('Client Secret is required');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateIntegrationPayload = {
        provider: provider.id,
        uniqueKey: uniqueKey.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      };

      if (scopes.trim()) payload.scopes = scopes.trim();

      await integrationApi.createIntegration(payload);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFormError(msg);
      onError(`Failed to add integration: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="text-3xl">{provider.icon}</div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">
              Add {provider.name} Integration
            </h2>
            <p className="text-xs text-gray-500">
              Configure OAuth credentials to connect {provider.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-surface-light transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-xs text-gray-400">
            <p className="font-medium text-accent-light mb-1">How to get credentials:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Go to the {provider.name} developer portal / app settings</li>
              <li>Create an OAuth app (or use an existing one)</li>
              <li>Set redirect URI to: <code className="text-accent bg-accent/10 px-1 rounded">https://api.nango.dev/oauth/callback</code></li>
              <li>Copy the Client ID and Client Secret below</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Integration Key <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={uniqueKey}
              onChange={(e) => setUniqueKey(e.target.value)}
              placeholder={provider.id}
              className="input-field font-mono text-xs"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Unique identifier for this integration in Nango
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Client ID <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Your OAuth Client ID"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Client Secret <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Your OAuth Client Secret"
                className="input-field text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Scopes</label>
            <input
              type="text"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              placeholder="Comma-separated scopes (e.g. read,write)"
              className="input-field text-xs"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              OAuth permission scopes required by your app
            </p>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <XCircle size={14} className="shrink-0" />
              {formError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg hover:bg-surface-light transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !uniqueKey.trim() || !clientId.trim() || !clientSecret.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-all"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Create Integration
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Manage Connection Modal ─────────── */

function ManageConnectionModal({
  integration,
  connections,
  onClose,
  onRefresh,
  onStatus,
}: {
  integration: NangoIntegration;
  connections: NangoConnection[];
  onClose: () => void;
  onRefresh: () => void;
  onStatus: (text: string, isError?: boolean) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const providerInfo = POPULAR_PROVIDERS.find((p) => p.id === integration.provider);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const config = await integrationApi.getConfig();
      const publicKey = config.publicKey;
      const host = config.host;
      const connectionId = `user-${integration.provider}-${Date.now()}`;

      const nango = new Nango({ publicKey, host });
      await nango.auth(integration.unique_key, connectionId);

      onStatus(`Connected to ${providerInfo?.name || integration.provider}!`);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      if (msg.includes('resource_capped') || msg.includes('maximum')) {
        onStatus(
          'Connection limit reached. Delete an existing connection or upgrade Nango plan.',
          true,
        );
      } else if (msg !== 'Connection cancelled' && msg !== 'user_cancelled') {
        onStatus(msg, true);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDelete = async (conn: NangoConnection) => {
    setDeleting(conn.connection_id);
    try {
      await integrationApi.deleteConnection(
        conn.provider_config_key,
        conn.connection_id,
      );
      onStatus('Connection removed');
      onRefresh();
    } catch (err) {
      onStatus(
        `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        true,
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="text-3xl">{providerInfo?.icon || '🔗'}</div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">
              {providerInfo?.name || integration.provider} Connections
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              {integration.unique_key}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-surface-light transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Connections list */}
        <div className="p-5 space-y-3">
          {connections.length === 0 ? (
            <div className="text-center py-6">
              <Link2 size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400 text-sm">No connections yet</p>
              <p className="text-gray-600 text-xs">
                Click "Connect Account" to authenticate
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {connections.map((conn) => (
                <div
                  key={conn.connection_id}
                  className="flex items-center gap-3 bg-canvas border border-border rounded-lg px-3 py-2.5"
                >
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-mono truncate">
                      {conn.connection_id}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Connected{' '}
                      {conn.created
                        ? new Date(conn.created).toLocaleDateString()
                        : 'recently'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(conn)}
                    disabled={deleting === conn.connection_id}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    title="Remove connection"
                  >
                    {deleting === conn.connection_id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-all"
          >
            {connecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ExternalLink size={16} />
            )}
            {connecting ? 'Connecting...' : 'Connect Account'}
          </button>

          <p className="text-[10px] text-gray-600 text-center">
            This will open an OAuth window to authenticate with{' '}
            {providerInfo?.name || integration.provider}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg hover:bg-surface-light transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
