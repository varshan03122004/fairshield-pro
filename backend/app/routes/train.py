from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models import DatasetMetadata, TrainedModel
from ..schemas import Model
from ..services.ml_model import MLModelService

router = APIRouter()
ml_service = MLModelService()

@router.post("/{dataset_id}", response_model=Model)
async def train_model(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(DatasetMetadata).filter(DatasetMetadata.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        metrics, model_path = ml_service.train_model(dataset.filepath)
        
        db_model = TrainedModel(
            dataset_id=dataset_id,
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            model_path=model_path,
            features=metrics["features"]
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        
        return db_model
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
