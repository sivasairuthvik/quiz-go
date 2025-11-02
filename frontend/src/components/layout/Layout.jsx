import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { CopilotKit } from "@copilotkit/react-core";
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="layout__loading">
        <div className="layout__loading-spinner">
          <div className="spinner"></div>
          <p>Loading Quiz Mantra...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <Navbar />
        <main className="layout__content">
          <div className="layout__content-wrapper">
            <CopilotKit publicApiKey={import.meta.env.VITE_COPILOT_PUBLIC_KEY || '<your-copilot-cloud-public-api-key>'}>
              <Outlet />
            </CopilotKit>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;