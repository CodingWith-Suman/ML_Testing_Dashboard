# ----------------------------------------------------------------------------------------------------------------------------------------
                                                #           Fast API
# ----------------------------------------------------------------------------------------------------------------------------------------

# api.py
import io
import os
from typing import Optional, Dict, Any

import numpy as np
from PIL import Image

import torch
from torchvision import models, transforms

import joblib
from fastapi import FastAPI, File, UploadFile, Request, Query
from fastapi.responses import JSONResponse

import exifread
import fitz

# ---------------- CONFIG ----------------
MODELS_DIR = os.getenv("MODELS_DIR", "models")
ID_CLF_PATH = os.path.join(MODELS_DIR, "id_classifier.pkl")
OOD_PATH    = os.path.join(MODELS_DIR, "ood_detector.pkl")
CLASSES_PKL = os.path.join(MODELS_DIR, "classes.pkl")

THRESH = float(os.getenv("THRESH", 0.60))           # restore sensible default
OOD_SCORE_MIN = float(os.getenv("OOD_SCORE_MIN", -1.0))  # soften OOD gate if needed
IMG_SIZE = (224, 224)

# ---------------- LOAD SKLEARN MODELS ----------------
try:
    clf     = joblib.load(ID_CLF_PATH)         # LogisticRegression trained on ID classes
    ocsvm   = joblib.load(OOD_PATH)            # OneClassSVM trained on ID embeddings
    classes = joblib.load(CLASSES_PKL)         # full dataset class names in global index order
    if not isinstance(classes, (list, tuple)):
        raise ValueError("classes.pkl must be a list/tuple in classifier output order.")
except Exception as e:
    raise RuntimeError(f"Failed to load sklearn models/classes: {e}")

# ---------------- DEVICE (CPU only) ----------------
DEVICE = torch.device("cpu")

# ---------------- RESNET50 (Embedding) ----------------
RESNET_LOCAL_WEIGHTS = os.getenv("RESNET_LOCAL_WEIGHTS", None)

def build_resnet50(device: torch.device) -> torch.nn.Module:
    """
    Build ResNet50 feature extractor. If downloads are blocked, use local weights
    via RESNET_LOCAL_WEIGHTS; otherwise fall back to weights=None (not recommended).
    """
    try:
        pretrained = False
        if RESNET_LOCAL_WEIGHTS and os.path.isfile(RESNET_LOCAL_WEIGHTS):
            m = models.resnet50(weights=None)
            state = torch.load(RESNET_LOCAL_WEIGHTS, map_location="cpu")
            m.load_state_dict(state, strict=False)
            pretrained = True
        else:
            try:
                m = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
                pretrained = True
            except Exception:
                try:
                    m = models.resnet50(weights="IMAGENET1K_V1")
                    pretrained = True
                except Exception:
                    m = models.resnet50(weights=None)  # random init
                    pretrained = False
        m.fc = torch.nn.Identity()
        m.eval()
        m.to(device)
        m._is_pretrained = pretrained  # attach flag for /health
        return m
    except Exception as e:
        raise RuntimeError(f"Failed to initialize ResNet50: {e}")

resnet = build_resnet50(DEVICE)

# ---------------- TRANSFORM ----------------
transform = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std =[0.229, 0.224, 0.225]),
])

# ---------------- HELPERS ----------------
def infer_from_filename(filename: str) -> Optional[str]:
    name = (filename or "").lower()
    if any(x in name for x in ["aadhaar", "aadhar", "aadha"]):
        return "Aadhaar"
    if "pan" in name:
        return "PAN"
    if "passport" in name:
        return "Passport"
    if "negative" in name:
        return "Negative"
    return None

def extract_image_metadata(image_bytes: bytes) -> Dict[str, Any]:
    meta: Dict[str, Any] = {"width": None, "height": None, "format": None, "exif": {}}
    try:
        img = Image.open(io.BytesIO(image_bytes))
        meta["width"] = img.width
        meta["height"] = img.height
        meta["format"] = img.format
    except Exception as e:
        meta["error"] = f"Image open failed: {e}"
        return meta

    try:
        bio = io.BytesIO(image_bytes)
        bio.seek(0)
        tags = exifread.process_file(bio, details=False)
        meta["exif"] = {
            tag: str(tags[tag])
            for tag in tags
            if tag not in ("JPEGThumbnail", "TIFFThumbnail")
        }
    except Exception as e:
        meta["exif_error"] = f"EXIF extraction failed: {e}"

    return meta

def extract_pdf_metadata(pdf_bytes: bytes) -> Dict[str, Any]:
    try:
        doc = fitz.open("pdf", pdf_bytes)
        m = doc.metadata or {}
        return {
            "author": m.get("author"),
            "creator": m.get("creator"),
            "producer": m.get("producer"),
            "title": m.get("title"),
            "creation_date": m.get("creationDate"),
            "modification_date": m.get("modDate"),
            "page_count": doc.page_count,
            "format": "PDF",
        }
    except Exception as e:
        return {"error": f"PDF metadata extraction failed: {e}", "format": "PDF"}

def pdf_first_page_to_image(pdf_bytes: bytes, dpi: int = 200) -> Image.Image:
    try:
        doc = fitz.open("pdf", pdf_bytes)
        if len(doc) == 0:
            raise ValueError("PDF has no pages")
        page = doc[0]
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        return Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        raise RuntimeError(f"PDF to image conversion failed: {e}")

# ---------------- FASTAPI APP ----------------
app = FastAPI(title="ID Card Classifier API", version="1.0")

@app.get("/health")
async def health():
    return JSONResponse({
        "status": "ok",
        "device": str(DEVICE),
        "classes": classes,
        "threshold": THRESH,
        "ood_score_min": OOD_SCORE_MIN,
        "resnet_pretrained": getattr(resnet, "_is_pretrained", False),
        "clf_classes_": [int(i) for i in clf.classes_.tolist()],  # e.g. [0,2,3]
    })

@app.post("/predict")
async def predict(
    request: Request,
    image: Optional[UploadFile] = File(None),
    file:  Optional[UploadFile] = File(None),
    skip_ood: bool = Query(False, description="Set true to bypass OOD for debugging"),
):
    up = image or file
    if up is None:
        return JSONResponse({"error": "No file provided (use form field 'image' or 'file')"}, status_code=400)

    filename = (up.filename or "").lower()
    try:
        raw = await up.read()
        if not raw:
            return JSONResponse({"error": "Empty file"}, status_code=400)

        is_pdf = filename.endswith(".pdf") or (getattr(up, "content_type", "") == "application/pdf")
        if is_pdf:
            pil_img = pdf_first_page_to_image(raw)
            metadata = extract_pdf_metadata(raw)
        else:
            pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
            metadata = extract_image_metadata(raw)

        x = transform(pil_img).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            emb = resnet(x).cpu().numpy()[0]

        # --- OOD gate ---
        ood_score = float(ocsvm.decision_function([emb])[0])  # higher is more in-distribution
        if not skip_ood:
            if ood_score < OOD_SCORE_MIN:
                return JSONResponse({
                    "file_based": infer_from_filename(filename),
                    "model_based": "Negative",
                    "label": "Negative",
                    "confidence": None,
                    "threshold": THRESH,
                    "metadata": metadata,
                    "type": "pdf" if is_pdf else "image",
                    "reason": "OOD",
                    "ood_score": ood_score,
                })

        # --- Classification with correct mapping ---
        probs = clf.predict_proba([emb])[0]              # (K,)
        class_ids = clf.classes_                         # e.g., array([0,2,3])
        id_to_name = {int(i): classes[int(i)] for i in class_ids}

        best_col = int(np.argmax(probs))
        best_class_id = int(class_ids[best_col])
        pred_label = id_to_name[best_class_id]
        max_prob = float(probs[best_col])

        # Threshold to Negative if low confidence
        final_label = pred_label if max_prob >= THRESH else "Negative"
        confidence_pct = f"{max_prob * 100.0:.2f}%"

        # Optional: per-class probs in ID space
        probs_dict = {id_to_name[int(i)]: float(p) for i, p in zip(class_ids, probs)}

        return JSONResponse({
            "file_based": infer_from_filename(filename),
            "model_based": pred_label,
            "label": final_label,
            "confidence": confidence_pct,
            "threshold": THRESH,
            "metadata": metadata,
            "type": "pdf" if is_pdf else "image",
            "ood_score": ood_score,
            "probs": probs_dict,
        })

    except Exception as e:
        return JSONResponse({"error": "Prediction failed", "details": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=6000, reload=True)

# # ---------------------------------------------------------------------------------------------------------------------------
#                                     #                       Flask API
# # ---------------------------------------------------------------------------------------------------------------------------

# import re
# import io
# import numpy as np
# import exifread
# from flask import Flask, request, jsonify
# from keras.models import load_model
# from keras.preprocessing import image
# from tensorflow.keras.applications.mobilenet_v3 import preprocess_input
# from PIL import Image
# import fitz  # PyMuPDF

# # import pillow_avif_plugin

# app = Flask(__name__)

# # Load model and class labels
# try:
#     model = load_model("models_x/cnn_id_document_with_negatives-v-0.1.keras")
#     classes = ["Pan card", "aadhaar", "passport", "negative"]
# except Exception as e:
#     raise RuntimeError(f"Failed to load ML model: {e}")

# # Utility Functions


# def preprocess_image(pil_img):
#     try:
#         img = pil_img.convert("RGB").resize((224, 224))
#         img_array = image.img_to_array(img)
#         img_array = preprocess_input(img_array)
#         return np.expand_dims(img_array, axis=0)
#     except Exception as e:
#         raise RuntimeError(f"Image preprocessing failed: {e}")


# def infer_from_filename(filename):
#     name = filename.lower()
#     if any(x in name for x in ["aadhaar", "aadhar", "aadha"]):
#         return "Aadhaar"
#     elif "Pan card" in name:
#         return "PAN"
#     elif "passport" in name:
#         return "Passport"
#     elif "negative" in name:
#         return "Negative"
#     return None


# def extract_image_metadata(image_bytes):
#     metadata = {
#         "width": None,
#         "height": None,
#         "format": None,
#         "exif": {},
#     }

#     try:
#         img = Image.open(io.BytesIO(image_bytes))
#         metadata["width"] = img.width
#         metadata["height"] = img.height
#         metadata["format"] = img.format
#     except Exception as e:
#         metadata["error"] = f"Image open failed: {e}"
#         return metadata

#     try:
#         tags = exifread.process_file(io.BytesIO(image_bytes), details=False)
#         metadata["exif"] = {
#             tag: str(tags[tag])
#             for tag in tags
#             if tag not in ("JPEGThumbnail", "TIFFThumbnail")
#         }
#     except Exception as e:
#         metadata["exif_error"] = f"EXIF extraction failed: {e}"

#     return metadata


# def extract_pdf_metadata(pdf_bytes):
#     try:
#         doc = fitz.open("pdf", pdf_bytes)
#         meta = doc.metadata or {}
#         return {
#             "author": meta.get("author"),
#             "creator": meta.get("creator"),
#             "producer": meta.get("producer"),
#             "title": meta.get("title"),
#             "creation_date": meta.get("creationDate"),
#             "modification_date": meta.get("modDate"),
#             "page_count": doc.page_count,
#         }
#     except Exception as e:
#         return {"error": f"PDF metadata extraction failed: {e}"}


# def pdf_to_image(pdf_bytes):
#     try:
#         doc = fitz.open("pdf", pdf_bytes)
#         if len(doc) == 0:
#             raise ValueError("PDF has no pages")
#         page = doc[0]
#         pix = page.get_pixmap(dpi=200)
#         img_bytes = pix.tobytes("jpeg")
#         return Image.open(io.BytesIO(img_bytes))
#     except Exception as e:
#         raise RuntimeError(f"PDF to image conversion failed: {e}")


# # API Route
# @app.route("/predict", methods=["POST"])
# def predict():
#     file = request.files.get("image")
#     if not file:
#         print("No image provided")
#         return jsonify({"error": "No image provided"}), 400

#     filename = file.filename.lower()
#     print(f"Received file: {filename}")

#     try:
#         raw = file.read()
#         print("File read successfully")

#         if filename.endswith(".pdf"):
#             print("Processing PDF")
#             image_obj = pdf_to_image(raw)
#             metadata = extract_pdf_metadata(raw)
#         else:
#             print("Processing image")
#             image_obj = Image.open(io.BytesIO(raw))
#             metadata = extract_image_metadata(raw)

#         img_array = preprocess_image(image_obj)
#         print("Preprocessing complete")
#     except Exception as e:
#         print("Error during file processing:", str(e))
#         return jsonify({"error": "Failed to process file", "details": str(e)}), 500

#     try:
#         print("Running model prediction")

#         # pred = model.predict(img_array)
#         # model_based = classes[np.argmax(pred)]

#         pred = model.predict(img_array)[0]  # Get the first prediction vector
#         predicted_index = np.argmax(pred)
#         model_based = classes[predicted_index]
#         confidence = float(pred[predicted_index]) * 100  # Convert to percentage

#         print("Prediction complete")
#     except Exception as e:
#         print("Error during model prediction:", str(e))
#         return jsonify({"error": "Model prediction failed", "details": str(e)}), 500

#     file_based = infer_from_filename(filename)

#     # return jsonify({
#     #     'file_based': file_based,
#     #     'model_based': model_based,
#     #     'label': model_based,
#     #     'metadata': metadata
#     # })
#     return jsonify(
#         {
#             "file_based": file_based,
#             "model_based": model_based,
#             "label": model_based,
#             "confidence": f"{confidence:.2f}%",
#             "metadata": metadata,
#         }
#     )


# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=6000, debug=True)
