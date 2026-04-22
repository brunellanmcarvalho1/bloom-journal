import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] border border-white/70 px-8 py-6 text-center text-ink-700">
          Warming up your diary...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export { ProtectedRoute };
