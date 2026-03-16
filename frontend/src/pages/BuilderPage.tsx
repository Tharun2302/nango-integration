import { Sidebar } from '../components/sidebar/Sidebar';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { NodeConfigPanel } from '../components/panels/NodeConfigPanel';
import { WorkflowSettingsPanel } from '../components/panels/WorkflowSettingsPanel';
import { ExecutionResultsPanel } from '../components/panels/ExecutionResultsPanel';
import { useWorkflowStore } from '../store/workflowStore';

export function BuilderPage() {
  const { selectedNodeId } = useWorkflowStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <WorkflowSettingsPanel />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkflowCanvas />
          <ExecutionResultsPanel />
        </div>
        {selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
}
