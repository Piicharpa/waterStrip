from flask import Flask, request, jsonify
import base64
import numpy as np
from PIL import Image
import io
import tensorflow as tf
import pickle
from tensorflow.keras.models import load_model
import cv2
from io import BytesIO

# Load model and scaler
model = tf.keras.models.load_model("my_model.h5")
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

app = Flask(__name__)

def extract_features_from_image(image_b64):
    # Strip header if it exists
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
        
    # Fix padding if needed
    missing_padding = len(image_b64) % 4
    if missing_padding:
        image_b64 += "=" * (4 - missing_padding)
        
    # Step 1: Decode the base64 image and ensure RGB mode
    image_data = base64.b64decode(image_b64)
    pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # Step 2: Convert to numpy array (OpenCV format)
    image = np.array(pil_image)
    
    # Step 3: Convert the image to HSV (for H, S, V)
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Step 4: Extract RGB features (mean values of each channel)
    mean_rgb = np.mean(image, axis=(0, 1))  # Mean across height and width
    mean_r, mean_g, mean_b = mean_rgb[2], mean_rgb[1], mean_rgb[0]  # OpenCV uses BGR by default
    
    # Step 5: Extract HSV features (mean values of each channel)
    mean_hsv = np.mean(hsv_image, axis=(0, 1))  # Mean across height and width
    mean_h, mean_s, mean_v = mean_hsv[0], mean_hsv[1], mean_hsv[2]
    
    # Step 6: Return the 6 features (R, G, B, H, S, V)
    features = [mean_r, mean_g, mean_b, mean_h, mean_s, mean_v]
    
    # Return the extracted features
    return features
  
@app.route("/", methods=["GET"])
def index():
    return "Flask ML service is running!", 200

'''
  {
    "image": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
'''
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        image_b64 = data["image"]
        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        features = extract_features_from_image(image_b64)
        scaled_features = scaler.transform([features])
        prediction = model.predict(scaled_features)
        return jsonify({"prediction": prediction.tolist()})

    except Exception as e:
        # log to console and return the error
        print("Error in /predict:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    

