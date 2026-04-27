import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os

class MLModelService:
    def __init__(self, model_dir="models"):
        self.model_dir = model_dir
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)

    def train_model(self, dataset_path, target_column="label", sensitive_cols=None, sample_weight=None):
        df = pd.read_csv(dataset_path)
        
        # Simple preprocessing: drop non-numeric if not sensitive
        # We explicitly drop transaction_id if it exists
        cols_to_drop = [target_column]
        if 'transaction_id' in df.columns:
            cols_to_drop.append('transaction_id')
        
        X = df.drop(columns=cols_to_drop)
        y = df[target_column]
        
        # Handle categorical sensitive cols by encoding them for training but keeping track
        # For simplicity, we assume the dataset is mostly numeric except sensitive cols
        X_encoded = pd.get_dummies(X)
        
        if sample_weight is not None:
            X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
                X_encoded, y, sample_weight, test_size=0.2, random_state=42
            )
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X_encoded, y, test_size=0.2, random_state=42
            )
            w_train = None
        
        model = RandomForestClassifier(class_weight="balanced", n_estimators=100, random_state=42)
        model.fit(X_train, y_train, sample_weight=w_train)
        
        y_pred = model.predict(X_test)
        
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred),
            "features": list(X_encoded.columns)
        }
        
        model_filename = f"model_{np.random.randint(1000, 9999)}.joblib"
        model_path = os.path.join(self.model_dir, model_filename)
        joblib.dump(model, model_path)
        
        return metrics, model_path

    def predict(self, model_path, input_data, features):
        model = joblib.load(model_path)
        
        # Create a dataframe from input
        df_input = pd.DataFrame([input_data])
        
        # Handle dummy variables manually for the input
        # This is a simplified approach for the demo
        processed_input = {}
        for feat in features:
            if feat in input_data:
                processed_input[feat] = input_data[feat]
            elif '_' in feat:
                # Handle dummy columns like gender_Male
                base_col, val = feat.rsplit('_', 1)
                if base_col in input_data:
                    # If the input value matches the dummy category, set 1, else 0
                    # This assumes input_data[base_col] is a string or matching value
                    processed_input[feat] = 1 if str(input_data[base_col]) == str(val) else 0
                else:
                    processed_input[feat] = 0
            else:
                processed_input[feat] = 0
                
        df_final = pd.DataFrame([processed_input])[features]
        prob = model.predict_proba(df_final)[0][1]
        return float(prob)
