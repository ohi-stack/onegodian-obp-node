import React, { useEffect, useState } from 'react';
import { Award, Plus } from 'lucide-react';

export default function Certificates() {
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/obp1/certificates')
      .then(res => res.json())
      .then(data => setCertificates(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Certificates</h1>
          <p className="text-neutral-500 mt-2">Manage and view issued OBP-1 verification certificates.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
          <Plus size={16} />
          Issue Certificate
        </button>
      </header>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {certificates.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center">
            <Award className="w-12 h-12 text-neutral-300 mb-4" />
            <p>No certificates issued yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3">Certificate ID</th>
                <th className="px-6 py-3">Issued To</th>
                <th className="px-6 py-3">Record ID</th>
                <th className="px-6 py-3">Issue Date (UTC)</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {certificates.map((c, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-mono text-xs">{c.certificate_id}</td>
                  <td className="px-6 py-4">{c.issued_to}</td>
                  <td className="px-6 py-4 font-mono text-xs">{c.record_id}</td>
                  <td className="px-6 py-4">{new Date(c.issue_timestamp_utc).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
