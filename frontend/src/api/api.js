import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const uploadDataset = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const trainModel = async (datasetId) => {
    const response = await api.post(`/train/${datasetId}`);
    return response.data;
};

export const analyzeBias = async (datasetId, sensitiveColumn) => {
    const response = await api.post('/bias/', { dataset_id: datasetId, sensitive_column: sensitiveColumn });
    return response.data;
};

export const mitigateBias = async (datasetId, sensitiveColumn) => {
    const response = await api.post('/mitigate/', { dataset_id: datasetId, sensitive_column: sensitiveColumn });
    return response.data;
};

export const predictFraud = async (modelId, data) => {
    const response = await api.post(`/predict/${modelId}`, { data });
    return response.data;
};

export default api;
