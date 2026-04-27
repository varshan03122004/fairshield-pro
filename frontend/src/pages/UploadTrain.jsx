import { useState } from 'react';
import { Upload, Cpu, CheckCircle, Loader2 } from 'lucide-react';
import { uploadDataset, trainModel } from '../api/api';

const UploadTrain = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, uploaded, training, completed
  const [datasetId, setDatasetId] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const data = await uploadDataset(file);
      setDatasetId(data.id);
      setStatus('uploaded');
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  const handleTrain = async () => {
    if (!datasetId) return;
    setStatus('training');
    try {
      const data = await trainModel(datasetId);
      setModelMetrics(data);
      setStatus('completed');
    } catch (err) {
      console.error(err);
      setStatus('uploaded');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Model Pipeline</h2>
        <p className="text-gray-500 mt-2">Upload your dataset and train a robust fraud detection model.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Card */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Upload className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">1. Upload Dataset</h3>
          <p className="text-sm text-gray-500 mb-6">Drag and drop your CSV file here or click to browse.</p>
          
          <input 
            type="file" 
            className="hidden" 
            id="file-upload" 
            onChange={(e) => setFile(e.target.files[0])}
            accept=".csv"
          />
          <label 
            htmlFor="file-upload"
            className="cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-8 py-4 w-full mb-4 hover:border-blue-400 transition-colors"
          >
            {file ? file.name : "Select CSV File"}
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || status !== 'idle'}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'uploading' ? <Loader2 className="animate-spin" /> : "Upload Now"}
          </button>
          
          {status === 'uploaded' || status === 'training' || status === 'completed' ? (
            <div className="mt-4 text-green-600 flex items-center gap-2 font-medium">
              <CheckCircle size={18} /> Dataset Ready (ID: {datasetId})
            </div>
          ) : null}
        </div>

        {/* Training Card */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
            <Cpu className="text-purple-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">2. Train Model</h3>
          <p className="text-sm text-gray-500 mb-6">Train a RandomForest model with balanced class weights.</p>

          <div className="flex-1 w-full flex flex-col justify-center">
             {status === 'completed' && modelMetrics ? (
               <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 uppercase">Accuracy</p>
                      <p className="text-lg font-bold">{(modelMetrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 uppercase">Precision</p>
                      <p className="text-lg font-bold">{(modelMetrics.precision * 100).toFixed(1)}%</p>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="h-24 flex items-center justify-center border-2 border-gray-50 rounded-xl mb-6 bg-gray-50/50">
                  <p className="text-sm text-gray-400 italic">No metrics yet</p>
               </div>
             )}
          </div>

          <button
            onClick={handleTrain}
            disabled={status !== 'uploaded'}
            className="w-full bg-purple-600 text-white rounded-xl py-3 font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'training' ? <Loader2 className="animate-spin" /> : "Start Training"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadTrain;
