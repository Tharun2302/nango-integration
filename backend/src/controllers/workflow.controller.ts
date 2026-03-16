import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Workflow } from '../types/workflow';
import { workflowStore } from '../services/workflow.store';
import { WorkflowEngine } from '../workflow-engine/engine';
import logger from '../utils/logger';

function extractError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export async function saveWorkflow(req: Request, res: Response) {
  try {
    const { id, name, description, nodes, edges } = req.body;

    const workflow: Workflow = {
      id: id || uuidv4(),
      name: name || 'Untitled Workflow',
      description,
      nodes: nodes || [],
      edges: edges || [],
      createdAt: id ? workflowStore.get(id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    workflowStore.save(workflow);
    logger.info(`Workflow saved: ${workflow.id}`);
    res.json({ success: true, workflow });
  } catch (error) {
    const err = extractError(error);
    logger.error('Failed to save workflow', err);
    res.status(500).json({ error: 'Failed to save workflow' });
  }
}

export async function getWorkflow(req: Request, res: Response) {
  try {
    const workflow = workflowStore.get(req.params.id);
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json({ workflow });
  } catch (error) {
    const err = extractError(error);
    logger.error('Failed to get workflow', err);
    res.status(500).json({ error: 'Failed to get workflow' });
  }
}

export async function listWorkflows(_req: Request, res: Response) {
  try {
    const workflows = workflowStore.list();
    res.json({ workflows });
  } catch (error) {
    const err = extractError(error);
    logger.error('Failed to list workflows', err);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
}

export async function runWorkflow(req: Request, res: Response) {
  try {
    const workflow = workflowStore.get(req.params.id);
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const engine = new WorkflowEngine();
    const result = await engine.execute(workflow, req.body.input);

    logger.info(`Workflow executed: ${workflow.id}`, {
      executionId: result.executionId,
    });

    res.json({ success: true, execution: result });
  } catch (error) {
    const err = extractError(error);
    logger.error('Failed to run workflow', err);
    res.status(500).json({ error: 'Failed to run workflow' });
  }
}

export async function deleteWorkflow(req: Request, res: Response) {
  try {
    const deleted = workflowStore.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    const err = extractError(error);
    logger.error('Failed to delete workflow', err);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
}
