import { Workflow } from '../types/workflow';

/**
 * In-memory workflow store. Replace with a database (PostgreSQL, MongoDB, etc.)
 * for production deployments.
 */
class WorkflowStore {
  private workflows = new Map<string, Workflow>();

  save(workflow: Workflow): Workflow {
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  get(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  list(): Workflow[] {
    return Array.from(this.workflows.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  delete(id: string): boolean {
    return this.workflows.delete(id);
  }
}

export const workflowStore = new WorkflowStore();
