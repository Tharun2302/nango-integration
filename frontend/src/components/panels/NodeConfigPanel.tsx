import { useCallback, useMemo } from 'react';
import { X, Settings } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { NodeType } from '../../types/workflow';
import { ConnectionPicker } from './ConnectionPicker';

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, updateNodeLabel } =
    useWorkflowStore();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const handleClose = useCallback(() => selectNode(null), [selectNode]);

  if (!selectedNode) return null;

  const { data } = selectedNode;

  return (
    <aside className="w-80 bg-surface border-l border-border flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-white">Node Config</h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <Field label="Label">
          <input
            type="text"
            value={data.label}
            onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
            className="input-field"
          />
        </Field>

        <Field label="Type">
          <input
            type="text"
            value={data.type}
            disabled
            className="input-field opacity-60"
          />
        </Field>

        <div className="h-px bg-border" />

        <ConfigFields
          nodeType={data.type}
          config={data.config}
          nodeId={selectedNode.id}
          updateConfig={updateNodeConfig}
        />
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

interface ConfigFieldsProps {
  nodeType: NodeType;
  config: Record<string, unknown>;
  nodeId: string;
  updateConfig: (nodeId: string, config: Record<string, unknown>) => void;
}

function ConfigFields({ nodeType, config, nodeId, updateConfig }: ConfigFieldsProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      updateConfig(nodeId, { [key]: value });
    },
    [nodeId, updateConfig]
  );

  switch (nodeType) {
    case 'trigger':
      return (
        <>
          <Field label="Trigger Type">
            <select
              value={(config.triggerType as string) || 'manual'}
              onChange={(e) => handleChange('triggerType', e.target.value)}
              className="input-field"
            >
              <option value="manual">Manual</option>
              <option value="webhook">Webhook</option>
              <option value="schedule">Schedule</option>
            </select>
          </Field>
        </>
      );

    case 'aiAgent':
      return (
        <>
          <Field label="Model">
            <select
              value={(config.model as string) || 'gpt-4o-mini'}
              onChange={(e) => handleChange('model', e.target.value)}
              className="input-field"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </Field>
          <Field label="System Prompt">
            <textarea
              value={(config.systemPrompt as string) || ''}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </Field>
          <Field label="User Prompt">
            <textarea
              value={(config.userPrompt as string) || ''}
              onChange={(e) => handleChange('userPrompt', e.target.value)}
              rows={3}
              placeholder="Use {{lastOutput}} for previous node output"
              className="input-field resize-none"
            />
          </Field>
          <Field label="Temperature">
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={(config.temperature as number) ?? 0.7}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              className="input-field"
            />
          </Field>
          <Field label="Max Tokens">
            <input
              type="number"
              step="100"
              min="1"
              max="128000"
              value={(config.maxTokens as number) ?? 1024}
              onChange={(e) => handleChange('maxTokens', parseInt(e.target.value, 10))}
              className="input-field"
            />
          </Field>
        </>
      );

    case 'slack':
      return (
        <>
          <Field label="Slack Connection">
            <ConnectionPicker
              provider="slack"
              value={(config.connectionId as string) || ''}
              onChange={(id) => handleChange('connectionId', id)}
            />
          </Field>
          <Field label="Channel">
            <input
              type="text"
              value={(config.channel as string) || ''}
              onChange={(e) => handleChange('channel', e.target.value)}
              placeholder="e.g. #general"
              className="input-field"
            />
          </Field>
          <Field label="Message Template">
            <textarea
              value={(config.messageTemplate as string) || ''}
              onChange={(e) => handleChange('messageTemplate', e.target.value)}
              rows={3}
              placeholder="Use {{lastOutput.message}} for AI output"
              className="input-field resize-none"
            />
          </Field>
        </>
      );

    case 'googleSheets':
      return (
        <>
          <Field label="Google Sheets Connection">
            <ConnectionPicker
              provider="google-sheets"
              value={(config.connectionId as string) || ''}
              onChange={(id) => handleChange('connectionId', id)}
            />
          </Field>
          <Field label="Spreadsheet ID">
            <input
              type="text"
              value={(config.spreadsheetId as string) || ''}
              onChange={(e) => handleChange('spreadsheetId', e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label="Sheet Name">
            <input
              type="text"
              value={(config.sheetName as string) || 'Sheet1'}
              onChange={(e) => handleChange('sheetName', e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label="Range">
            <input
              type="text"
              value={(config.range as string) || 'A1'}
              onChange={(e) => handleChange('range', e.target.value)}
              className="input-field"
            />
          </Field>
        </>
      );

    case 'httpRequest':
      return (
        <>
          <Field label="Method">
            <select
              value={(config.method as string) || 'GET'}
              onChange={(e) => handleChange('method', e.target.value)}
              className="input-field"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </Field>
          <Field label="URL">
            <input
              type="text"
              value={(config.url as string) || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://api.example.com/data"
              className="input-field"
            />
          </Field>
          <Field label="Headers (JSON)">
            <textarea
              value={
                typeof config.headers === 'string'
                  ? config.headers
                  : JSON.stringify(config.headers || {}, null, 2)
              }
              onChange={(e) => {
                try {
                  handleChange('headers', JSON.parse(e.target.value));
                } catch {
                  handleChange('headers', e.target.value);
                }
              }}
              rows={3}
              className="input-field resize-none font-mono text-xs"
            />
          </Field>
          <Field label="Body (JSON)">
            <textarea
              value={
                typeof config.body === 'string'
                  ? config.body
                  : JSON.stringify(config.body || null, null, 2)
              }
              onChange={(e) => {
                try {
                  handleChange('body', JSON.parse(e.target.value));
                } catch {
                  handleChange('body', e.target.value);
                }
              }}
              rows={4}
              className="input-field resize-none font-mono text-xs"
            />
          </Field>
        </>
      );

    default:
      return <p className="text-xs text-gray-500">No configuration available.</p>;
  }
}
