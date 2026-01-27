import os
import pickle
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    """Utility class for loading and managing ML models"""
    
    def __init__(self):
        self.lstm_model = None
        self.mpt_model = None
        self.lstm_path = os.getenv("LSTM_MODEL_PATH", "./models/lstm_price_forecast.h5")
        self.mpt_path = os.getenv("MPT_MODEL_PATH", "./models/mpt_optimizer.pkl")
    
    def load_lstm_model(self):
        """Load LSTM price forecasting model"""
        try:
            if not os.path.exists(self.lstm_path):
                logger.warning(f"LSTM model not found at {self.lstm_path}")
                return None
            
            # Import TensorFlow only when needed
            try:
                from tensorflow import keras
                self.lstm_model = keras.models.load_model(self.lstm_path)
                logger.info("✅ LSTM model loaded successfully")
                return self.lstm_model
            except ImportError:
                logger.error("TensorFlow not installed. Cannot load LSTM model.")
                return None
                
        except Exception as e:
            logger.error(f"Error loading LSTM model: {e}")
            return None
    
    def load_mpt_model(self):
        """Load MPT portfolio optimization model"""
        try:
            if not os.path.exists(self.mpt_path):
                logger.warning(f"MPT model not found at {self.mpt_path}")
                return None
            
            with open(self.mpt_path, 'rb') as f:
                self.mpt_model = pickle.load(f)
            
            logger.info("✅ MPT model loaded successfully")
            return self.mpt_model
            
        except Exception as e:
            logger.error(f"Error loading MPT model: {e}")
            return None
    
    def get_lstm_model(self):
        """Get LSTM model, loading it if necessary"""
        if self.lstm_model is None:
            self.load_lstm_model()
        return self.lstm_model
    
    def get_mpt_model(self):
        """Get MPT model, loading it if necessary"""
        if self.mpt_model is None:
            self.load_mpt_model()
        return self.mpt_model
    
    def save_lstm_model(self, model, path: Optional[str] = None):
        """Save LSTM model to disk"""
        try:
            save_path = path or self.lstm_path
            model.save(save_path)
            logger.info(f"✅ LSTM model saved to {save_path}")
        except Exception as e:
            logger.error(f"Error saving LSTM model: {e}")
    
    def save_mpt_model(self, model, path: Optional[str] = None):
        """Save MPT model to disk"""
        try:
            save_path = path or self.mpt_path
            with open(save_path, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"✅ MPT model saved to {save_path}")
        except Exception as e:
            logger.error(f"Error saving MPT model: {e}")

# Global model loader instance
model_loader = ModelLoader()
