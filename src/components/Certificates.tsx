import React from 'react';
import { Award, Lock } from 'lucide-react';

export default function Certificates() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Certificates</h1>
        <p className="text-neutral-500 mt-2">
          OBP-1 certificates may be issued only for records already in the verified state.
        </p>
      </header>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-neutral-100 rounded-lg"><Award className="w-6 h-6" /></div>
          <div>
            <h2 className="font-semibold">Authority-protected issuance</h2>
            <p className="text-sm text-neutral-500 mt-2">
              Certificate creation and certificate enumeration require server-side OBP-1 authority credentials. Those credentials are never exposed to this browser interface.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700">
              <Lock size={16} /> Protected API operation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
