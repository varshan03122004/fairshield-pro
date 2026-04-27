from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models import TrainedModel
from ..schemas import PredictionInput, PredictionOutput
from ..services.ml_model import MLModelService

router = APIRouter()
ml_service = MLModelService()

@router.post("/{model_id}", response_model=PredictionOutput)
async def predict_fraud(model_id: int, input_data: PredictionInput, db: Session = Depends(get_db)):
    model_record = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model_record:
        raise HTTPException(status_code=404, detail="Model not found")
    
    try:
        prob = ml_service.predict(model_record.model_path, input_data.data, model_record.features)
        return {
            "fraud_probability": prob,
            "is_fraud": prob > 0.5
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
