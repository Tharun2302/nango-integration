import { Router } from 'express';
import {
  saveWorkflow,
  getWorkflow,
  listWorkflows,
  runWorkflow,
  deleteWorkflow,
} from '../controllers/workflow.controller';

export const workflowRouter = Router();

workflowRouter.post('/save', saveWorkflow);
workflowRouter.get('/list', listWorkflows);
workflowRouter.get('/:id', getWorkflow);
workflowRouter.post('/:id/run', runWorkflow);
workflowRouter.delete('/:id', deleteWorkflow);
