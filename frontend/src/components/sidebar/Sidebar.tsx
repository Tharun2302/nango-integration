import { useCallback, DragEvent } from 'react';
import {
  Zap,
  Brain,
  MessageSquare,
  Sheet,
  Globe,
  LucideIcon,
  Workflow,
} from 'lucide-react';
import { NODE_TYPE_DEFINITIONS, NodeType } from '../../types/workflow';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Brain,
  MessageSquare,
  Sheet,
  Globe,
};

export function Sidebar() {
  const onDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, nodeType: NodeType) => {
      event.dataTransfer.setData('application/workflownode', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Workflow size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">AI Workflow</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Builder</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Nodes
        </p>
        <div className="space-y-2">
          {NODE_TYPE_DEFINITIONS.map((def) => {
            const Icon = ICON_MAP[def.icon] || Zap;
            return (
              <div
                key={def.type}
                draggable
                onDragStart={(e) => onDragStart(e, def.type)}
                className="
                  flex items-center gap-3 p-3 rounded-lg
                  bg-surface-light/50 border border-border
                  cursor-grab active:cursor-grabbing
                  hover:border-accent/50 hover:bg-surface-light
                  transition-all duration-150 group
                "
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${def.color}20` }}
                >
                  <Icon size={16} style={{ color: def.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                    {def.label}
                  </p>
                  <p className="text-[11px] text-gray-500">{def.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-border">
        <p className="text-[11px] text-gray-600 text-center">
          Drag nodes onto the canvas
        </p>
      </div>
    </aside>
  );
}
