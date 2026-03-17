import { Router } from 'express';
import {
  listConnections,
  listIntegrations,
  createIntegration,
  deleteIntegration,
  getAvailableProviders,
  createConnectSession,
  getConnection,
  deleteConnection,
  getNangoConfig,
} from '../controllers/integration.controller';

export const integrationRouter = Router();

integrationRouter.get('/config', getNangoConfig);
integrationRouter.get('/providers', getAvailableProviders);
integrationRouter.get('/integrations', listIntegrations);
integrationRouter.put('/integrations', createIntegration);
integrationRouter.delete('/integrations/:uniqueKey', deleteIntegration);
integrationRouter.get('/connections', listConnections);
integrationRouter.post('/connect-session', createConnectSession);
integrationRouter.get('/connections/:provider/:connectionId', getConnection);
integrationRouter.delete('/connections/:provider/:connectionId', deleteConnection);
