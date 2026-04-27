import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Scale, Zap, ShieldCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import UploadTrain from './pages/UploadTrain';
import BiasAnalysis from './pages/BiasAnalysis';
import Predict from './pages/Predict';

function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/upload', icon: <Upload size={20} />, label: 'Upload & Train' },
    { path: '/bias', icon: <Scale size={20} />, label: 'Bias Analysis' },
    { path: '/predict', icon: <Zap size={20} />, label: 'Predict' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <ShieldCheck className="text-blue-600" size={32} />
          <h1 className="text-xl font-bold tracking-tight">FairShield</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">System Status</p>
            <p className="mt-1 font-medium">Model: Active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadTrain />} />
          <Route path="/bias" element={<BiasAnalysis />} />
          <Route path="/predict" element={<Predict />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
