import { useState } from 'react';
import { Zap, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { predictFraud } from '../api/api';

const Predict = () => {
  const [modelId, setModelId] = useState('');
  const [formData, setFormData] = useState({
    amount: 1500.0,
    time_hour: 14,
    location: 1, // mapping
    device: 1,   // mapping
    gender: 1,   // mapping
    region: 1    // mapping
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handlePredict = async () => {
    if (!modelId) return;
    setLoading(true);
    try {
      const data = await predictFraud(modelId, formData);
      setPrediction(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Fraud Predictor</h2>
        <p className="text-gray-500 mt-1">Test the model with individual transaction data.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex gap-4 mb-4">
           <div className="flex-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Model ID</label>
             <input 
                type="number" 
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter Model ID"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
              />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {Object.keys(formData).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace('_', ' ')}</label>
              <input 
                type="number" 
                name={key}
                value={formData[key]}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handlePredict}
          disabled={loading || !modelId}
          className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />} Run Prediction
        </button>

        {prediction && (
          <div className={`mt-8 p-6 rounded-2xl border ${prediction.is_fraud ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} animate-in zoom-in-95`}>
            <div className="flex items-center gap-4">
              {prediction.is_fraud ? (
                <ShieldAlert className="text-red-600" size={32} />
              ) : (
                <ShieldCheck className="text-green-600" size={32} />
              )}
              <div>
                <h4 className={`text-lg font-bold ${prediction.is_fraud ? 'text-red-700' : 'text-green-700'}`}>
                  {prediction.is_fraud ? 'FRAUD SUSPECTED' : 'TRANSACTION LEGIT'}
                </h4>
                <p className="text-sm opacity-80">
                  Fraud Probability: {(prediction.fraud_probability * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predict;
