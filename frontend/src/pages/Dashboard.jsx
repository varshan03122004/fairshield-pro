import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Total Transactions', value: '1,240', icon: <TrendingUp className="text-blue-500" /> },
    { label: 'Fraud Detected', value: '42', icon: <AlertCircle className="text-red-500" /> },
    { label: 'Legit Transactions', value: '1,198', icon: <CheckCircle2 className="text-green-500" /> },
    { label: 'Avg Fairness Score', value: '94%', icon: <Users className="text-purple-500" /> },
  ];

  const chartData = [
    { name: 'Legit', value: 1198 },
    { name: 'Fraud', value: 42 },
  ];

  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">System Overview</h2>
        <p className="text-gray-500 mt-1">Real-time fraud detection and fairness metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-gray-50 rounded-lg">{stat.icon}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Transaction Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-600">Most fraud attempts originate from <span className="font-semibold">Region B</span>.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-red-500" />
              <p className="text-sm text-gray-600">Fairness gap detected between <span className="font-semibold">Male</span> and <span className="font-semibold">Female</span> groups.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
              <p className="text-sm text-gray-600">Bias mitigation has improved FPR parity by <span className="font-semibold">12%</span>.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
