from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import os
import uuid
from ..db.database import get_db
from ..models import DatasetMetadata
from ..schemas import Dataset

router = APIRouter()

UPLOAD_DIR = "dataset_uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/", response_model=Dataset)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    try:
        df = pd.read_csv(file_path)
        columns = list(df.columns)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
        
    db_dataset = DatasetMetadata(
        filename=file.filename,
        filepath=file_path,
        columns=columns
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    return db_dataset
