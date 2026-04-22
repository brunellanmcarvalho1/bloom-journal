import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShell } from "./components/AppShell.jsx";
import { useAuth } from "./hooks/useAuth.js";

const AuthPage = lazy(() =>
  import("./pages/AuthPage.jsx").then((module) => ({
    default: module.AuthPage,
  })),
);
const CalendarPage = lazy(() =>
  import("./pages/CalendarPage.jsx").then((module) => ({
    default: module.CalendarPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage.jsx").then((module) => ({
    default: module.DashboardPage,
  })),
);
const NewEntryPage = lazy(() =>
  import("./pages/NewEntryPage.jsx").then((module) => ({
    default: module.NewEntryPage,
  })),
);
const StudyPage = lazy(() =>
  import("./pages/StudyPage.jsx").then((module) => ({
    default: module.StudyPage,
  })),
);

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="glass-panel rounded-[2rem] border border-white/70 px-8 py-6 text-center text-ink-700">
            Preparing your pages...
          </div>
        </div>
      }
    >
      <Routes>
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="write" element={<NewEntryPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="study/:category" element={<StudyPage />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
