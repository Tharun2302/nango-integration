import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Zap,
  Brain,
  MessageSquare,
  Sheet,
  Globe,
  Trash2,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { WorkflowNodeData } from '../../types/workflow';
import { useWorkflowStore } from '../../store/workflowStore';
import { useExecutionStore } from '../../store/executionStore';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Brain,
  MessageSquare,
  Sheet,
  Globe,
};

function WorkflowNodeComponent({ id, data, selected }: NodeProps<WorkflowNodeData>) {
  const { selectNode, deleteNode } = useWorkflowStore();
  const nodeStatus = useExecutionStore((s) => s.nodeStatuses[id]);
  const Icon = ICON_MAP[data.icon || 'Zap'] || Zap;

  const handleClick = useCallback(() => {
    selectNode(id);
  }, [id, selectNode]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNode(id);
    },
    [id, deleteNode]
  );

  const statusRing = nodeStatus === 'success'
    ? 'ring-2 ring-green-500/60 shadow-lg shadow-green-500/20'
    : nodeStatus === 'error'
    ? 'ring-2 ring-red-500/60 shadow-lg shadow-red-500/20'
    : '';

  return (
    <div
      onClick={handleClick}
      className={`
        relative min-w-[200px] rounded-xl overflow-hidden cursor-pointer
        transition-all duration-200 group
        ${selected && !nodeStatus ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : ''}
        ${statusRing}
        ${!selected && !nodeStatus ? 'hover:ring-1 hover:ring-accent/50' : ''}
      `}
      style={{ background: '#1a1a2e' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!-top-[5px]"
      />

      <div
        className="h-1.5 w-full"
        style={{ background: data.color || '#6366f1' }}
      />

      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${data.color}20` }}
          >
            <Icon size={16} style={{ color: data.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-100 truncate">
              {data.label}
            </p>
            <p className="text-xs text-gray-500 truncate">{data.type}</p>
          </div>

          {nodeStatus === 'success' && (
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          )}
          {nodeStatus === 'error' && (
            <XCircle size={16} className="text-red-400 shrink-0" />
          )}

          <button
            onClick={handleDelete}
            className="
              opacity-0 group-hover:opacity-100 transition-opacity
              p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400
            "
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!-bottom-[5px]"
      />
    </div>
  );
}

export default memo(WorkflowNodeComponent);
