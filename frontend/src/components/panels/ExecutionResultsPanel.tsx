import { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
  Brain,
  MessageSquare,
  Sheet,
  Globe,
  Maximize2,
  Minimize2,
  LucideIcon,
  Activity,
  SkipForward,
} from 'lucide-react';
import { useExecutionStore, ExecutionLog } from '../../store/executionStore';

const ICON_MAP: Record<string, LucideIcon> = {
  trigger: Zap,
  aiAgent: Brain,
  slack: MessageSquare,
  googleSheets: Sheet,
  httpRequest: Globe,
};

const TYPE_LABELS: Record<string, string> = {
  trigger: 'Trigger',
  aiAgent: 'AI Agent',
  slack: 'Slack',
  googleSheets: 'Google Sheets',
  httpRequest: 'HTTP Request',
};

const TYPE_COLORS: Record<string, string> = {
  trigger: '#f59e0b',
  aiAgent: '#8b5cf6',
  slack: '#4ade80',
  googleSheets: '#34d399',
  httpRequest: '#60a5fa',
};

export function ExecutionResultsPanel() {
  const { lastExecution, showResults, closeResults } = useExecutionStore();
  const [maximized, setMaximized] = useState(false);

  if (!showResults || !lastExecution) return null;

  const successCount = lastExecution.logs.filter((l) => l.status === 'success').length;
  const errorCount = lastExecution.logs.filter((l) => l.status === 'error').length;
  const totalDuration = lastExecution.logs.reduce((sum, l) => sum + (l.duration || 0), 0);

  return (
    <div
      className="bg-surface border-t border-border flex flex-col transition-all duration-300"
      style={{ height: maximized ? '70vh' : '45vh', minHeight: '280px' }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-4 shrink-0">
        <Activity size={18} className="text-accent" />
        <h3 className="text-base font-bold text-white">Execution Results</h3>

        <div className="flex items-center gap-4 ml-4">
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-400">
            <CheckCircle2 size={15} /> {successCount} passed
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-400">
              <XCircle size={15} /> {errorCount} failed
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Clock size={15} /> {(totalDuration / 1000).toFixed(2)}s
          </span>
        </div>

        <div className="flex-1" />

        <span className="text-xs text-gray-600 font-mono bg-canvas px-2 py-1 rounded">
          ID: {lastExecution.executionId.slice(0, 8)}
        </span>

        <button
          onClick={() => setMaximized(!maximized)}
          title={maximized ? 'Minimize' : 'Maximize'}
          className="p-1.5 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <button
          onClick={closeResults}
          className="p-1.5 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {lastExecution.logs.map((log, i) => (
          <LogEntry key={`${log.nodeId}-${i}`} log={log} index={i} />
        ))}

        {lastExecution.logs.length === 0 && (
          <div className="text-center text-gray-500 text-base py-12">
            No execution logs available.
          </div>
        )}
      </div>
    </div>
  );
}

function extractMessage(output: unknown): string | null {
  if (!output || typeof output !== 'object') return null;
  const obj = output as Record<string, unknown>;
  if (typeof obj.message === 'string') return obj.message;
  if (obj.skipped && typeof obj.reason === 'string') return obj.reason;
  return null;
}

function LogEntry({ log, index }: { log: ExecutionLog; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[log.nodeType] || Zap;
  const color = TYPE_COLORS[log.nodeType] || '#6366f1';
  const label = TYPE_LABELS[log.nodeType] || log.nodeType;
  const isSuccess = log.status === 'success';
  const isSkipped = !!(log.output && typeof log.output === 'object' && (log.output as Record<string, unknown>).skipped);
  const previewMessage = extractMessage(log.output);

  return (
    <div
      className={`
        rounded-xl border overflow-hidden transition-all
        ${isSkipped
          ? 'border-yellow-500/20 bg-yellow-500/5'
          : isSuccess
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5'
        }
      `}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm text-gray-500 font-mono w-6 text-center font-bold">{index + 1}</span>

        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}
        >
          <Icon size={16} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-100">{label}</span>
            {isSkipped && (
              <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded font-medium">
                <SkipForward size={10} /> SKIPPED
              </span>
            )}
          </div>
          {previewMessage && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[500px]">
              {previewMessage.slice(0, 120)}{previewMessage.length > 120 ? '...' : '' as string}
            </p>
          )}
        </div>

        {isSkipped ? (
          <SkipForward size={16} className="text-yellow-400 shrink-0" />
        ) : isSuccess ? (
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
        ) : (
          <XCircle size={16} className="text-red-400 shrink-0" />
        )}

        {log.duration != null && (
          <span className="text-xs text-gray-500 tabular-nums font-mono min-w-[60px] text-right">
            {log.duration >= 1000 ? `${(log.duration / 1000).toFixed(1)}s` : `${log.duration}ms`}
          </span>
        )}

        {expanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 mt-1">
          {log.error && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400 uppercase mb-1.5">Error</p>
              <p className="text-sm text-red-300 font-mono">{log.error}</p>
            </div>
          )}

          {log.output != null && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Output</p>
              {hasSheetPreview(log.output) ? (
                <SheetPreview output={log.output as Record<string, unknown>} />
              ) : (
                <pre className="text-sm text-gray-300 bg-canvas rounded-xl p-4 overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed border border-border">
                  {typeof log.output === 'string'
                    ? log.output
                    : JSON.stringify(log.output, null, 2)}
                </pre>
              )}
            </div>
          )}

          {log.input != null && !hasSheetPreview(log.output) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Input</p>
              <pre className="text-sm text-gray-400 bg-canvas rounded-xl p-4 overflow-x-auto max-h-40 overflow-y-auto font-mono leading-relaxed border border-border">
                {typeof log.input === 'string'
                  ? log.input
                  : JSON.stringify(log.input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function hasSheetPreview(output: unknown): boolean {
  if (!output || typeof output !== 'object') return false;
  return 'sheetPreview' in (output as Record<string, unknown>);
}

function SheetPreview({ output }: { output: Record<string, unknown> }) {
  const preview = output.sheetPreview as { headers: string[]; rows: string[][] } | undefined;
  const sheetName = (output.sheetName as string) || 'Sheet1';
  const range = (output.range as string) || 'A1';
  const spreadsheetUrl = output.spreadsheetUrl as string | undefined;
  const isWritten = !!output.written;

  if (!preview) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-border ${isWritten ? 'bg-green-500/15' : 'bg-green-500/10'}`}>
        <Sheet size={14} className="text-green-400" />
        <span className="text-xs font-semibold text-green-400">
          {isWritten ? 'Google Sheets — Data Written!' : 'Google Sheets Preview'}
        </span>
        <span className="text-[10px] text-gray-500 ml-2">
          {sheetName} • {range}
        </span>
        {!!output.skipped && (
          <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded ml-auto">
            Preview — add connection ID to write for real
          </span>
        )}
        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-accent-light hover:text-white bg-accent/10 hover:bg-accent/20 px-2 py-0.5 rounded ml-auto transition-colors"
          >
            Open in Google Sheets ↗
          </a>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-light/50">
              {preview.headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-300 border-b border-border border-r border-r-border last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-white/[0.02]">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-gray-300 border-r border-r-border last:border-r-0 max-w-[300px]">
                    <span className="block truncate" title={cell}>
                      {cell.length > 100 ? cell.slice(0, 100) + '...' : cell}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
