import pandas as pd
import numpy as np

class BiasEngine:
    @staticmethod
    def calculate_metrics(df, sensitive_col, target_col, pred_col):
        """
        Calculate fairness metrics across groups in sensitive_col.
        """
        groups = df[sensitive_col].unique()
        metrics = {}
        
        overall_positive_rate = df[pred_col].mean()
        
        for group in groups:
            group_df = df[df[sensitive_col] == group]
            
            # True Positives, False Positives, etc.
            tp = len(group_df[(group_df[target_col] == 1) & (group_df[pred_col] == 1)])
            fp = len(group_df[(group_df[target_col] == 0) & (group_df[pred_col] == 1)])
            tn = len(group_df[(group_df[target_col] == 0) & (group_df[pred_col] == 0)])
            fn = len(group_df[(group_df[target_col] == 1) & (group_df[pred_col] == 0)])
            
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
            selection_rate = group_df[pred_col].mean()
            
            metrics[str(group)] = {
                "fpr": float(fpr),
                "fnr": float(fnr),
                "selection_rate": float(selection_rate),
                "count": int(len(group_df))
            }
            
        # Statistical Parity Difference (SPD)
        # Max selection rate - Min selection rate
        rates = [m["selection_rate"] for m in metrics.values()]
        spd = max(rates) - min(rates) if rates else 0
        
        # Disparate Impact
        di = min(rates) / max(rates) if rates and max(rates) > 0 else 1
        
        return {
            "group_metrics": metrics,
            "statistical_parity_difference": float(spd),
            "disparate_impact": float(di)
        }

    @staticmethod
    def apply_reweighting(df, sensitive_col, target_col):
        """
        Calculate weights for each (group, label) pair to mitigate bias.
        """
        n = len(df)
        n_pos = len(df[df[target_col] == 1])
        n_neg = n - n_pos
        
        groups = df[sensitive_col].unique()
        weights = np.ones(n)
        
        for group in groups:
            n_g = len(df[df[sensitive_col] == group])
            n_g_pos = len(df[(df[sensitive_col] == group) & (df[target_col] == 1)])
            n_g_neg = n_g - n_g_pos
            
            # W = (P(y) * P(g)) / P(y, g)
            # W_pos = (n_pos/n * n_g/n) / (n_g_pos/n) = (n_pos * n_g) / (n * n_g_pos)
            if n_g_pos > 0:
                w_pos = (n_pos * n_g) / (n * n_g_pos)
                df.loc[(df[sensitive_col] == group) & (df[target_col] == 1), 'weight'] = w_pos
            
            if n_g_neg > 0:
                w_neg = (n_neg * n_g) / (n * n_g_neg)
                df.loc[(df[sensitive_col] == group) & (df[target_col] == 0), 'weight'] = w_neg
                
        return df['weight'].values
