from flask import Flask, request, jsonify
import base64
import numpy as np
from PIL import Image
import io
import cv2
from io import BytesIO
from joblib import load

# Load model
model = load('ph_model.joblib')

app = Flask(__name__)

def extract_features_from_image(image_b64):
    # Strip header if it exists
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
        
    # Fix padding if needed
    missing_padding = len(image_b64) % 4
    if missing_padding:
        image_b64 += "=" * (4 - missing_padding)
        
    # Decode base64 and convert to PIL Image
    image_data = base64.b64decode(image_b64)
    pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # Resize to 50x50 using the same method as in notebook
    pil_image = pil_image.resize((50, 50), Image.BILINEAR)  # or whatever you used
    np_img = np.array(pil_image)
    
    # Compute average RGB (EXACTLY as in notebook)
    avg_rgb = np.mean(np_img.reshape(-1, 3), axis=0)
    
    # Convert to HSV using the EXACT same pipeline as notebook
    # Note: This matches your notebook's RGB→BGR→HSV conversion
    np_img_bgr = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
    np_img_hsv = cv2.cvtColor(np_img_bgr, cv2.COLOR_BGR2HSV)
    avg_hsv = np.mean(np_img_hsv.reshape(-1, 3), axis=0)
    
    # Concatenate features in the SAME order
    features = np.concatenate([avg_rgb, avg_hsv])
    
    # Debug output to verify
    print("Extracted Features (R,G,B,H,S,V):", features)
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
        # Make prediction (reshape for single sample)
        prediction = model.predict([features])[0]
        
        # Ensure pH is in 0-14 range
        final_prediction = max(0, min(14, round(prediction, 2)))

        return jsonify({"prediction": final_prediction}), 200

    except Exception as e:
        # log to console and return the error
        print("Error in /predict:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    

