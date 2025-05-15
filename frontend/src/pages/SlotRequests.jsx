import React, { useState, useEffect } from 'react';
import { getSlotRequests, approveRequest, rejectRequest } from '../utils/api';

const SlotRequests = () => {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSlotRequests(page, limit, search);
      setRequests(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [page, search]);

  const handleApprove = async (id) => {
    try {
      const response = await approveRequest(id);
      alert(`Request approved. Slot: ${response.data.slot.slot_number}. Email: ${response.data.emailStatus}`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      const response = await rejectRequest(selectedRequestId, rejectReason);
      alert(`Request rejected. Email: ${response.data.emailStatus}`);
      setRejectReason('');
      setSelectedRequestId(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject request');
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequestDetails(request);
  };

  const closeDetailsModal = () => {
    setSelectedRequestDetails(null);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">Slot Requests</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by plate number or status"
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
                <th className="p-2 text-left">Plate Number</th>
                <th className="p-2 text-left">Vehicle Type</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-accent">
                  <td className="p-2">{req.id}</td>
                  <td className="p-2">{req.plate_number}</td>
                  <td className="p-2">{req.vehicle_type}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(req.request_status)}`}>
                      {req.request_status}
                    </span>
                  </td>
                  <td className="p-2">
                    {req.request_status.toLowerCase() === 'pending' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequestId(req.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleViewDetails(req)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRequestId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">
              Reject Request #{selectedRequestId}
            </h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-secondary"
              rows="4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setRejectReason('');
                  setSelectedRequestId(null);
                }}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">
              Request Details #{selectedRequestDetails.id}
            </h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Plate Number:</span> {selectedRequestDetails.plate_number}</p>
              <p><span className="font-semibold">Vehicle Type:</span> {selectedRequestDetails.vehicle_type}</p>
              <p><span className="font-semibold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequestDetails.request_status)}`}>
                  {selectedRequestDetails.request_status}
                </span>
              </p>
              {selectedRequestDetails.request_status.toLowerCase() === 'rejected' && selectedRequestDetails.rejection_reason && (
                <p><span className="font-semibold">Rejection Reason:</span> {selectedRequestDetails.rejection_reason}</p>
              )}
              {selectedRequestDetails.request_status.toLowerCase() === 'approved' && selectedRequestDetails.slot && (
                <p><span className="font-semibold">Assigned Slot:</span> {selectedRequestDetails.slot.slot_number}</p>
              )}
              <p><span className="font-semibold">Created At:</span> {new Date(selectedRequestDetails.created_at).toLocaleString()}</p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeDetailsModal}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
              >
                Close
              </button>
            </div>
          </div>
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

export default SlotRequests;