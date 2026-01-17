import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import { checkAccess } from './lib/api';
import { useTradingStore } from './lib/store';

function App() {
  const { address, isConnected } = useAccount();
  const setAccessStatus = useTradingStore((s) => s.setAccessStatus);

  // Check access when wallet connects
  const { data: accessStatus } = useQuery({
    queryKey: ['access', address],
    queryFn: () => checkAccess(address!),
    enabled: !!address,
  });

  useEffect(() => {
    setAccessStatus(accessStatus || null);
  }, [accessStatus, setAccessStatus]);

  return (
    <BrowserRouter>
      <Routes>
        {!isConnected ? (
          <Route path="*" element={<Landing />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
