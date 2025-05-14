import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { getSlotRequests } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getSlotRequests(1, 1000, ''); // Fetch all requests
        const requests = response.data.data;
        const pending = requests.filter((r) => r.request_status === 'pending').length;
        const approved = requests.filter((r) => r.request_status === 'approved').length;
        const rejected = requests.filter((r) => r.request_status === 'rejected').length;
        setStats({ pending, approved, rejected });
      } catch (err) {
        console.error('Fetch stats error:', err);
      }
    };
    fetchStats();
  }, []);

  const chartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Slot Requests',
        data: [stats.pending, stats.approved, stats.rejected],
        backgroundColor: ['#3B82F6', '#22C55E', '#EF4444'],
      },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">Admin Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-primary mb-4">Request Statistics</h2>
        <div className="w-full md:w-1/2 mx-auto">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Slot Request Statuses' },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;