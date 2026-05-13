import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { MapPage } from '@/pages/MapPage';
import { StationPage } from '@/pages/StationPage';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LocationReporter } from '@/components/shared/LocationReporter';

function App() {
  return (
    <AppLayout>
      <LocationReporter />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/station/:id" element={<StationPage />} />
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default App;
