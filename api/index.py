import base64, io, json
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from mangum import Mangum

app = FastAPI(title="FairShield API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── helpers ────────────────────────────────────────────────
def decode_csv(b64: str) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(base64.b64decode(b64)))

def encode_model(model) -> str:
    buf = io.BytesIO()
    joblib.dump(model, buf)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

def decode_model(b64: str):
    return joblib.load(io.BytesIO(base64.b64decode(b64)))

def bias_metrics(df, sensitive_col, target_col, pred_col):
    groups = df[sensitive_col].unique()
    metrics = {}
    for g in groups:
        gdf = df[df[sensitive_col] == g]
        fp = len(gdf[(gdf[target_col]==0)&(gdf[pred_col]==1)])
        tn = len(gdf[(gdf[target_col]==0)&(gdf[pred_col]==0)])
        tp = len(gdf[(gdf[target_col]==1)&(gdf[pred_col]==1)])
        fn = len(gdf[(gdf[target_col]==1)&(gdf[pred_col]==0)])
        fpr = fp/(fp+tn) if (fp+tn)>0 else 0
        sel = float(gdf[pred_col].mean())
        metrics[str(g)] = {"fpr": float(fpr), "fnr": float(fn/(fn+tp)) if (fn+tp)>0 else 0,
                            "selection_rate": sel, "count": int(len(gdf))}
    rates = [v["selection_rate"] for v in metrics.values()]
    spd = float(max(rates)-min(rates)) if rates else 0.0
    di  = float(min(rates)/max(rates)) if rates and max(rates)>0 else 1.0
    return {"group_metrics": metrics, "statistical_parity_difference": spd, "disparate_impact": di}

def prep_features(df):
    cols_drop = ["label"] + (["transaction_id"] if "transaction_id" in df.columns else [])
    X = pd.get_dummies(df.drop(columns=cols_drop))
    y = df["label"]
    return X, y

# ── schemas ────────────────────────────────────────────────
class UploadReq(BaseModel):
    filename: str
    data_b64: str

class TrainReq(BaseModel):
    data_b64: str

class PredictReq(BaseModel):
    model_b64: str
    features: List[str]
    input_data: Dict[str, Any]

class BiasReq(BaseModel):
    data_b64: str
    model_b64: str
    features: List[str]
    sensitive_column: str

class MitigateReq(BaseModel):
    data_b64: str
    sensitive_column: str

# ── routes ─────────────────────────────────────────────────
@app.get("/api")
def root():
    return {"status": "ok", "message": "FairShield API v2 running"}

@app.post("/api/upload")
def upload(req: UploadReq):
    try:
        df = decode_csv(req.data_b64)
        if "label" not in df.columns:
            raise HTTPException(400, "CSV must contain a 'label' column (0=legit, 1=fraud)")
        return {"id": f"DS-{np.random.randint(100000,999999)}",
                "filename": req.filename, "columns": list(df.columns),
                "row_count": len(df), "data_b64": req.data_b64}
    except HTTPException: raise
    except Exception as e: raise HTTPException(400, str(e))

@app.post("/api/train")
def train(req: TrainReq):
    try:
        df = decode_csv(req.data_b64)
        X, y = prep_features(df)
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
        clf = RandomForestClassifier(n_estimators=20, max_depth=10,
                                     class_weight="balanced", random_state=42, n_jobs=-1)
        clf.fit(Xtr, ytr)
        yp = clf.predict(Xte)
        return {"id": f"MOD-{np.random.randint(100000,999999)}",
                "accuracy": float(accuracy_score(yte, yp)),
                "precision": float(precision_score(yte, yp, zero_division=0)),
                "recall": float(recall_score(yte, yp, zero_division=0)),
                "f1_score": float(f1_score(yte, yp, zero_division=0)),
                "features": list(X.columns), "model_b64": encode_model(clf)}
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/predict")
def predict(req: PredictReq):
    try:
        clf = decode_model(req.model_b64)
        row = {}
        for feat in req.features:
            if feat in req.input_data:
                row[feat] = req.input_data[feat]
            elif '_' in feat:
                base, val = feat.rsplit('_', 1)
                row[feat] = 1 if str(req.input_data.get(base,"")) == val else 0
            else:
                row[feat] = 0
        prob = float(clf.predict_proba(pd.DataFrame([row])[req.features])[0][1])
        return {"fraud_probability": prob, "is_fraud": prob > 0.5}
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/bias")
def bias(req: BiasReq):
    try:
        df = decode_csv(req.data_b64)
        clf = decode_model(req.model_b64)
        X, _ = prep_features(df)
        for col in req.features:
            if col not in X.columns: X[col] = 0
        df["prediction"] = clf.predict(X[req.features])
        return bias_metrics(df, req.sensitive_column, "label", "prediction")
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/mitigate")
def mitigate(req: MitigateReq):
    try:
        df = decode_csv(req.data_b64)
        X, y = prep_features(df)
        # reweighting
        n = len(df); n_pos = (y==1).sum(); n_neg = n - n_pos
        weights = np.ones(n)
        for g in df[req.sensitive_column].unique():
            mask = df[req.sensitive_column]==g
            ng = mask.sum()
            ng_pos = ((mask)&(y==1)).sum(); ng_neg = ng-ng_pos
            if ng_pos>0: weights[(mask)&(y==1)] = (n_pos*ng)/(n*ng_pos)
            if ng_neg>0: weights[(mask)&(y==0)] = (n_neg*ng)/(n*ng_neg)
        clf = RandomForestClassifier(n_estimators=20, max_depth=10,
                                     class_weight="balanced", random_state=42, n_jobs=-1)
        clf.fit(X, y, sample_weight=weights)
        df["prediction"] = clf.predict(X)
        result = bias_metrics(df, req.sensitive_column, "label", "prediction")
        result["model_b64"] = encode_model(clf)
        result["features"] = list(X.columns)
        yp = clf.predict(X)
        result["accuracy"] = float(accuracy_score(y, yp))
        result["recall"]   = float(recall_score(y, yp, zero_division=0))
        return result
    except Exception as e: raise HTTPException(500, str(e))

handler = Mangum(app, lifespan="off")
