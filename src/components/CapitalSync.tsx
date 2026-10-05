import { RefreshCw, Lock } from 'lucide-react';

export default function CapitalSync() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Capital Integration</h1>
        <p className="text-neutral-500 mt-2">Legacy Capital integration boundary for ODeFi consolidation.</p>
      </header>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-neutral-100 rounded-lg"><RefreshCw className="w-6 h-6 text-neutral-700" /></div>
          <div>
            <h2 className="text-lg font-semibold">Adapter required</h2>
            <p className="text-sm text-neutral-500 mt-2">
              The former mock sync and mock verification actions are disabled. Capital data may enter OBP-1 only through an explicitly documented, authenticated adapter that registers records without automatically verifying them.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700"><Lock size={16} /> In Development</div>
          </div>
        </div>
      </div>
    </div>
  );
}
