import React, { useState } from 'react';
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { QuickMarkModal } from './components/attendance/QuickMarkModal';
import { AcademicBackground } from './components/common/AcademicBackground';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AttendanceProvider } from './context/AttendanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AttendanceHistoryPage } from './pages/AttendanceHistoryPage';
import { BunkCalculatorPage } from './pages/BunkCalculatorPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MedicalLeavePage } from './pages/MedicalLeavePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SignupPage } from './pages/SignupPage';
import { SubjectsPage } from './pages/SubjectsPage';

const SIDEBAR_HIDDEN_PATHS = new Set(['/', '/login', '/signup']);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
        Loading workspace...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickMarkOpen, setQuickMarkOpen] = useState(false);

  const hideSidebar = SIDEBAR_HIDDEN_PATHS.has(location.pathname) || !user;

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
      <AcademicBackground />
      <Navbar
        showSidebarToggle={!hideSidebar}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenQuickMark={() => setQuickMarkOpen(true)}
      />

      <div className="mx-auto flex max-w-7xl">
        {!hideSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main
          className={`min-w-0 flex-1 ${
            hideSidebar ? '' : 'px-4 py-6 sm:px-6 lg:px-8'
          }`}
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage onOpenQuickMark={() => setQuickMarkOpen(true)} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/calculator" element={<BunkCalculatorPage />} />
            <Route path="/medical" element={<MedicalLeavePage />} />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <QuickMarkModal
        isOpen={quickMarkOpen}
        onClose={() => setQuickMarkOpen(false)}
      />
    </div>
  );
};

export function App() {
  const isFileProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'file:';
  const Router = isFileProtocol ? HashRouter : BrowserRouter;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AttendanceProvider>
            <Router>
              <AppShell />
            </Router>
          </AttendanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
