import React from "react";
import { Routes, Route } from "react-router-dom";
import Scan from "./pages/ScanPage";
import BatchesPage from "./pages/BatchesPage";
import BatchDetailsPage from "./pages/BatchDetailsPage";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard/dashboard";

const App: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Optional: simple top nav */}
        {/* <header className="p-4 border-b flex gap-4">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'text-blue-600 font-semibold' : ''}>
          Scan
        </NavLink>
        <NavLink to="/batches" className={({ isActive }) => isActive ? 'text-blue-600 font-semibold' : ''}>
          Batches
        </NavLink>
      </header> */}

        <main>
          <Routes>
            {/* default route */}
            <Route path="/" element={<Scan />} />

            {/* batches list */}
            <Route path="/batches" element={<BatchesPage />} />

            {/* batch details */}
            <Route path="/batches/:id" element={<BatchDetailsPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />

            <Route path="/dashboard" element={<Dashboard></Dashboard>}></Route>
          </Routes>
        </main>
      </div>
    </Layout>
  );
};

export default App;
