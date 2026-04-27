import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldAlert, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { analyzeBias, mitigateBias } from '../api/api';

const BiasAnalysis = () => {
  const [datasetId, setDatasetId] = useState('');
  const [sensitiveCol, setSensitiveCol] = useState('gender');
  const [metrics, setMetrics] = useState(null);
  const [mitigatedMetrics, setMitigatedMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!datasetId) return;
    setLoading(true);
    try {
      const data = await analyzeBias(datasetId, sensitiveCol);
      setMetrics(data);
      setMitigatedMetrics(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMitigate = async () => {
    if (!datasetId) return;
    setLoading(true);
    try {
      const data = await mitigateBias(datasetId, sensitiveCol);
      setMitigatedMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transformChartData = (m) => {
    if (!m) return [];
    return Object.keys(m.group_metrics).map(key => ({
      name: key,
      fpr: (m.group_metrics[key].fpr * 100).toFixed(2),
      selection_rate: (m.group_metrics[key].selection_rate * 100).toFixed(2)
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold">Bias Detection Engine</h2>
          <p className="text-gray-500 mt-1">Audit and mitigate algorithmic bias in your fraud detection models.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="number" 
            placeholder="Dataset ID" 
            className="border border-gray-200 rounded-lg px-4 py-2 w-32 focus:ring-2 focus:ring-blue-500 outline-none"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
          />
          <select 
             className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
             value={sensitiveCol}
             onChange={(e) => setSensitiveCol(e.target.value)}
          >
            <option value="gender">Gender</option>
            <option value="region">Region</option>
          </select>
          <button
            onClick={handleAnalyze}
            disabled={loading || !datasetId}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />} Analyze
          </button>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Before Mitigation */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex justify-between">
              Baseline Performance
              <span className="text-xs font-normal text-gray-400 bg-gray-50 px-2 py-1 rounded">Pre-Mitigation</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformChartData(metrics)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fpr" name="False Positive Rate" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selection_rate" name="Selection Rate" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Stat Parity Diff</p>
                <p className="text-xl font-bold text-red-700">{metrics.statistical_parity_difference.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Disparate Impact</p>
                <p className="text-xl font-bold text-orange-700">{metrics.disparate_impact.toFixed(4)}</p>
              </div>
            </div>
            {!mitigatedMetrics && (
              <button
                onClick={handleMitigate}
                className="w-full mt-6 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                Apply Mitigation <RefreshCw size={18} />
              </button>
            )}
          </div>

          {/* After Mitigation */}
          {mitigatedMetrics && (
            <div className="bg-white p-8 rounded-2xl border border-green-200 shadow-sm animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-semibold mb-6 flex justify-between">
                Optimized Performance
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">Post-Mitigation</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transformChartData(mitigatedMetrics)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="fpr" name="False Positive Rate" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="selection_rate" name="Selection Rate" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">New Stat Parity Diff</p>
                  <p className="text-xl font-bold text-green-700">{mitigatedMetrics.statistical_parity_difference.toFixed(4)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">New Disparate Impact</p>
                  <p className="text-xl font-bold text-blue-700">{mitigatedMetrics.disparate_impact.toFixed(4)}</p>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-gray-50 flex items-center justify-between text-sm text-gray-600">
                <span>Fairness Improvement</span>
                <span className="font-bold text-green-600">
                  {Math.abs((mitigatedMetrics.statistical_parity_difference - metrics.statistical_parity_difference) / metrics.statistical_parity_difference * 100).toFixed(1)}% reduction in bias
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BiasAnalysis;
