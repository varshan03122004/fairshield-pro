from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import joblib
from ..db.database import get_db
from ..models import DatasetMetadata, TrainedModel
from ..schemas import BiasAnalysisRequest, BiasMetrics
from ..services.bias_engine import BiasEngine

router = APIRouter()

@router.post("/", response_model=BiasMetrics)
async def analyze_bias(request: BiasAnalysisRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetMetadata).filter(DatasetMetadata.id == request.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get the latest model for this dataset
    model_record = db.query(TrainedModel).filter(TrainedModel.dataset_id == request.dataset_id).order_by(TrainedModel.id.desc()).first()
    if not model_record:
        raise HTTPException(status_code=404, detail="No model found for this dataset")
    
    try:
        df = pd.read_csv(dataset.filepath)
        model = joblib.load(model_record.model_path)
        
        # Prepare data for prediction (must match training features)
        cols_to_drop = ["label"]
        if 'transaction_id' in df.columns:
            cols_to_drop.append('transaction_id')
        X = df.drop(columns=cols_to_drop)
        X_encoded = pd.get_dummies(X)
        
        # Ensure columns match
        for col in model_record.features:
            if col not in X_encoded.columns:
                X_encoded[col] = 0
        X_encoded = X_encoded[model_record.features]
        
        df['prediction'] = model.predict(X_encoded)
        
        metrics = BiasEngine.calculate_metrics(df, request.sensitive_column, "label", "prediction")
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bias analysis failed: {str(e)}")
