import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { 
  ShieldCheck, 
  Database, 
  Award, 
  RefreshCw, 
  FileText, 
  Settings,
  LayoutDashboard
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Registry from './components/Registry';
import Certificates from './components/Certificates';
import CapitalSync from './components/CapitalSync';
import AuditLogs from './components/AuditLogs';

function Layout() {
  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <ShieldCheck className="w-6 h-6" />
            OBP-1 Node
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink to="/obp1" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarLink to="/obp1/registry" icon={<Database size={18} />} label="Registry" />
          <SidebarLink to="/obp1/certificates" icon={<Award size={18} />} label="Certificates" />
          <SidebarLink to="/obp1/capital-sync" icon={<RefreshCw size={18} />} label="Capital Sync" />
          <SidebarLink to="/obp1/audit" icon={<FileText size={18} />} label="Audit Logs" />
          <div className="pt-4 mt-4 border-t border-neutral-100">
            <SidebarLink to="/obp1/settings" icon={<Settings size={18} />} label="Settings" />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 text-neutral-600 rounded-md hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="obp1" element={<Dashboard />} />
          <Route path="obp1/registry" element={<Registry />} />
          <Route path="obp1/certificates" element={<Certificates />} />
          <Route path="obp1/capital-sync" element={<CapitalSync />} />
          <Route path="obp1/audit" element={<AuditLogs />} />
          <Route path="obp1/settings" element={<div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-200">Settings Configuration...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
