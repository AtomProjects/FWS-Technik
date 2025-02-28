import { Suspense } from "react";
import ShoppingPage from "./components/shopping/ShoppingPage";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import EventsPage from "./components/events/EventsPage";
import Home from "./components/home";
import Dashboard from "./components/dashboard/Dashboard";
import InventoryPage from "./components/inventory/InventoryPage";
import routes from "tempo-routes";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" />
            )}
          </Routes>
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
