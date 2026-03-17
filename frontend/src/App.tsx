import { useState } from 'react';
import { BuilderPage } from './pages/BuilderPage';
import { IntegrationsPage } from './pages/IntegrationsPage';

type Page = 'builder' | 'integrations';

export default function App() {
  const [page, setPage] = useState<Page>('builder');

  if (page === 'integrations') {
    return <IntegrationsPage onBack={() => setPage('builder')} />;
  }

  return <BuilderPage onNavigateIntegrations={() => setPage('integrations')} />;
}
