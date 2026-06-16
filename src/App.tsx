import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SharedAppLayout } from './layouts/shared-app-layout';
import { HomePage } from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import Profile from './pages/Profile';
import Upskilling from './pages/Upskilling';
import BusinessSolutions from './pages/BusinessSolutions';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* All application views wrap securely within the Shared Layout framework */}
        <Route path="/" element={<SharedAppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="upskilling" element={<Upskilling />} />
          <Route path="profile" element={<Profile />} />
          <Route path="business" element={<BusinessSolutions />} />
          {/* Catch missing route endpoints safely */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
