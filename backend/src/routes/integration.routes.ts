import { Router } from 'express';
import {
  listConnections,
  listIntegrations,
  createConnectSession,
  getConnection,
  deleteConnection,
  getNangoConfig,
} from '../controllers/integration.controller';

export const integrationRouter = Router();

integrationRouter.get('/config', getNangoConfig);
integrationRouter.get('/integrations', listIntegrations);
integrationRouter.get('/connections', listConnections);
integrationRouter.post('/connect-session', createConnectSession);
integrationRouter.get('/connections/:provider/:connectionId', getConnection);
integrationRouter.delete('/connections/:provider/:connectionId', deleteConnection);
