import React, { useEffect, useState } from 'react';
import { Activity, Database, Award, Link2 } from 'lucide-react';

export default function Dashboard() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/obp1/status')
      .then((res) => res.json())
      .then(setStatus)
      .catch(console.error);
  }, []);

  const counts = status?.counts || {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">OBP-1™ Verification Authority</h1>
        <p className="text-neutral-500 mt-2">
          Registry-backed verification and provenance service. Verification is read-only and fail-closed.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Service Status" value={status?.status ? String(status.status).replace('_', ' ') : 'Checking…'} icon={<Activity className="text-amber-500" />} />
        <StatCard title="Node Version" value={status?.version || '…'} icon={<Database className="text-blue-500" />} />
        <StatCard title="Registry Records" value={String(counts.records ?? 0)} icon={<Link2 className="text-purple-500" />} />
        <StatCard title="Verified Records" value={String(counts.verified ?? 0)} icon={<Award className="text-green-600" />} />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Authority Boundary</h2>
        <div className="space-y-3 text-sm">
          <Row label="Service" value={status?.name || 'OBP-1™'} />
          <Row label="Verification Mode" value={status?.authorityMode || 'registry-backed-fail-closed'} />
          <Row label="Hash Algorithm" value="SHA-256" />
          <Row label="Verification Creates Records" value={status?.verificationCreatesRecords === false ? 'No' : 'Unknown'} />
          <Row label="Production Ready" value={status?.productionReady ? 'Yes' : 'No — In Development'} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-neutral-100 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-neutral-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm font-medium text-neutral-500">{title}</p>
        <p className="text-2xl font-semibold mt-1 capitalize">{value}</p>
      </div>
    </div>
  );
}
