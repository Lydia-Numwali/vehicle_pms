import React, { useState, useEffect } from 'react';
import { getLogs } from '../utils/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getLogs(page, limit, search);
      setLogs(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">Activity Logs</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by action or user ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-primary">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-primary text-white">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">User ID</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-accent">
                  <td className="p-2">{log.id}</td>
                  <td className="p-2">{log.user_id}</td>
                  <td className="p-2">{log.action}</td>
                  <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="bg-secondary text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <span className="text-primary">
          Page {meta.currentPage} of {meta.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
          disabled={page === meta.totalPages}
          className="bg-secondary text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Logs;