import React, { useEffect, useState } from 'react';
import { Activity, Database, Award, Link2 } from 'lucide-react';

export default function Dashboard() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/obp1/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 mt-2">Overview of OBP-1 Node status and recent activity.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="System Status" value={status?.status === 'operational' ? 'Operational' : 'Checking...'} icon={<Activity className="text-green-500" />} />
        <StatCard title="Node Version" value={status?.version || '...'} icon={<Database className="text-blue-500" />} />
        <StatCard title="Total Records" value="0" icon={<Link2 className="text-purple-500" />} />
        <StatCard title="Certificates Issued" value="0" icon={<Award className="text-orange-500" />} />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Node Identity</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500">Service</span>
            <span className="font-medium">{status?.node || '...'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500">Algorithm</span>
            <span className="font-medium font-mono">SHA-256</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500">Uptime</span>
            <span className="font-medium">100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | React.ReactNode, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-neutral-50 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-500">{title}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  );
}
