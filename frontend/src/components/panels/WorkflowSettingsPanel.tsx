import { useState, useCallback } from 'react';
import { Save, Play, Trash2, Download, Upload, CheckCircle2, Loader2, AlertCircle, Activity } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useExecutionStore } from '../../store/executionStore';
import { workflowApi } from '../../services/api';

export function WorkflowSettingsPanel() {
  const { workflowName, setWorkflowName, setWorkflowId, toJSON, loadWorkflow, clearWorkflow } =
    useWorkflowStore();
  const { isRunning, setRunning, setExecution, lastExecution, toggleResults, clearExecution } =
    useExecutionStore();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

  const showStatus = (text: string, isError = false) => {
    setStatus({ text, isError });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    try {
      const data = toJSON();
      const result = await workflowApi.save(data);
      setWorkflowId(result.workflow.id);
      showStatus('Saved successfully');
    } catch (err) {
      showStatus(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`, true);
    } finally {
      setSaving(false);
    }
  }, [toJSON, setWorkflowId]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    clearExecution();
    setStatus(null);
    try {
      const data = toJSON();
      const saved = await workflowApi.save(data);
      const workflowId = saved.workflow.id;
      setWorkflowId(workflowId);

      const response = await workflowApi.run(workflowId, {});
      const execution = response.execution as {
        workflowId: string;
        executionId: string;
        logs: Array<{
          nodeId: string;
          nodeType: string;
          status: 'pending' | 'running' | 'success' | 'error';
          input?: unknown;
          output?: unknown;
          error?: string;
          timestamp: string;
          duration?: number;
        }>;
        variables: Record<string, unknown>;
      };

      setExecution(execution);

      const errors = execution.logs.filter((l) => l.status === 'error');
      if (errors.length > 0) {
        showStatus(`Completed with ${errors.length} error(s)`, true);
      } else {
        showStatus(`All ${execution.logs.length} nodes executed successfully`);
      }
    } catch (err) {
      setRunning(false);
      showStatus(`Run failed: ${err instanceof Error ? err.message : 'Unknown error'}`, true);
    }
  }, [toJSON, setWorkflowId, setRunning, setExecution, clearExecution]);

  const handleExport = useCallback(() => {
    const data = toJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [toJSON, workflowName]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        loadWorkflow({
          id: data.id || '',
          name: data.name || 'Imported Workflow',
          nodes: data.nodes || [],
          edges: data.edges || [],
        });
        clearExecution();
        showStatus('Workflow imported');
      } catch {
        showStatus('Invalid workflow file', true);
      }
    };
    input.click();
  }, [loadWorkflow, clearExecution]);

  const handleClear = useCallback(() => {
    clearWorkflow();
    clearExecution();
  }, [clearWorkflow, clearExecution]);

  return (
    <div className="bg-surface border-b border-border px-4 py-2.5 flex items-center gap-3">
      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className="
          bg-transparent text-sm font-semibold text-white
          border-b border-transparent hover:border-border focus:border-accent
          outline-none px-1 py-0.5 transition-colors
        "
      />

      <div className="flex-1" />

      {status && (
        <div className={`flex items-center gap-1.5 text-xs ${status.isError ? 'text-red-400' : 'text-accent-light'}`}>
          {status.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {status.text}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {lastExecution && (
          <button
            onClick={toggleResults}
            title="Toggle execution results"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-accent-light hover:bg-accent/10 transition-all"
          >
            <Activity size={14} />
            Logs
          </button>
        )}

        <ToolbarButton icon={Upload} label="Import" onClick={handleImport} />
        <ToolbarButton icon={Download} label="Export" onClick={handleExport} />
        <ToolbarButton icon={Trash2} label="Clear" onClick={handleClear} variant="danger" />

        <div className="w-px h-6 bg-border mx-1" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
            rounded-lg bg-surface-light border border-border
            hover:border-accent/50 hover:text-accent-light
            disabled:opacity-50 transition-all
          "
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
            rounded-lg bg-accent text-white
            hover:bg-accent-light
            disabled:opacity-50 transition-all
          "
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        p-1.5 rounded-lg transition-all
        ${
          variant === 'danger'
            ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
            : 'text-gray-500 hover:text-gray-300 hover:bg-surface-light'
        }
      `}
    >
      <Icon size={16} />
    </button>
  );
}
