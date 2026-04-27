from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from ..db.database import get_db
from ..models import DatasetMetadata, TrainedModel
from ..schemas import BiasAnalysisRequest, BiasMetrics
from ..services.bias_engine import BiasEngine

router = APIRouter()

@router.post("/", response_model=BiasMetrics)
async def mitigate_bias(request: BiasAnalysisRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetMetadata).filter(DatasetMetadata.id == request.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = pd.read_csv(dataset.filepath)
        
        # Apply reweighting
        weights = BiasEngine.apply_reweighting(df, request.sensitive_column, "label")
        
        # Re-train with weights
        cols_to_drop = ["label"]
        if 'transaction_id' in df.columns:
            cols_to_drop.append('transaction_id')
        X = df.drop(columns=cols_to_drop)
        y = df["label"]
        X_encoded = pd.get_dummies(X)
        
        model = RandomForestClassifier(class_weight="balanced", n_estimators=100, random_state=42)
        model.fit(X_encoded, y, sample_weight=weights)
        
        # Calculate new metrics
        df['prediction'] = model.predict(X_encoded)
        metrics = BiasEngine.calculate_metrics(df, request.sensitive_column, "label", "prediction")
        
        # SAVE THE MITIGATED MODEL
        model_filename = f"model_mitigated_{np.random.randint(1000, 9999)}.joblib"
        model_path = os.path.join("models", model_filename)
        joblib.dump(model, model_path)
        
        # Create a new record in TrainedModel table
        db_model = TrainedModel(
            dataset_id=request.dataset_id,
            accuracy=accuracy_score(y, df['prediction']),
            precision=precision_score(y, df['prediction']),
            recall=recall_score(y, df['prediction']),
            f1_score=f1_score(y, df['prediction']),
            model_path=model_path,
            features=list(X_encoded.columns)
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {str(e)}")
