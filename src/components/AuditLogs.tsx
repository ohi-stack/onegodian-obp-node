import { FileText, Lock } from 'lucide-react';

export default function AuditLogs() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Audit Logs</h1>
        <p className="text-neutral-500 mt-2">Append-only application audit events for authority mutations.</p>
      </header>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 flex items-start gap-4">
        <FileText className="w-8 h-8 text-neutral-400" />
        <div>
          <h2 className="font-semibold">Protected operational evidence</h2>
          <p className="text-sm text-neutral-500 mt-2">
            Full audit-log access requires server-side authority authentication and is intentionally unavailable to the public browser UI.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700"><Lock size={16} /> Authority access required</div>
        </div>
      </div>
    </div>
  );
}
