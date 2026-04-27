from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class DatasetBase(BaseModel):
    filename: str
    filepath: str
    columns: List[str]

class DatasetCreate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int

    class Config:
        orm_mode = True

class ModelBase(BaseModel):
    dataset_id: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    model_path: str
    features: List[str]

class ModelCreate(ModelBase):
    pass

class Model(ModelBase):
    id: int

    class Config:
        orm_mode = True

class PredictionInput(BaseModel):
    data: Dict[str, Any]

class PredictionOutput(BaseModel):
    fraud_probability: float
    is_fraud: bool

class BiasAnalysisRequest(BaseModel):
    dataset_id: int
    sensitive_column: str

class BiasMetrics(BaseModel):
    group_metrics: Dict[str, Dict[str, float]]
    statistical_parity_difference: float
    disparate_impact: float
