# FairShield: Unbiased Credit Card Fraud Detection System

FairShield is a full-stack web application that combines machine learning for fraud detection with algorithmic fairness auditing. It allows users to upload datasets, train models, analyze bias across sensitive attributes, and apply mitigation techniques.

## 🚀 Features

- **Fraud Detection**: Uses Random Forest Classifier with class balancing.
- **Bias Analysis**: Computes False Positive Rate (FPR) parity and Statistical Parity Difference.
- **Bias Mitigation**: Implements group-reweighting to improve fairness.
- **Interactive Dashboard**: Visualizes data distributions and fairness metrics using Recharts.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide icons.

## 🛠️ Tech Stack

- **Backend**: FastAPI, Scikit-learn, Pandas, SQLAlchemy, SQLite.
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Axios.

## 📋 Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```powershell
   cd fairshield/backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```powershell
   python -m uvicorn app.main:app --reload
   ```
   *Note: Using `python -m uvicorn` ensures the command is run from your virtual environment's path.*
   The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd fairshield/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

## 📊 Dataset Format

The system expects a CSV file with the following columns:
`amount, time_hour, location, device, gender, region, label`

- `label`: 1 for fraud, 0 for legitimate.
- `gender`, `region`: Categorical sensitive attributes for bias analysis.

## ⚖️ Bias Mitigation Logic

The system uses **Reweighting**, a pre-processing technique that assigns different weights to training samples based on their sensitive attribute and label to ensure equal selection rates and error parity across groups.
