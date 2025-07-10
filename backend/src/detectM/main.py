from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import shutil
import os
import uuid

app = FastAPI()
origins = [
    "http://localhost:5173",  # หรือ URL ของ React frontend
    # "https://yourfrontend.com" ถ้า deploy แล้ว
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        UPLOAD_DIR = "uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # สร้างชื่อไฟล์ใหม่แบบไม่ซ้ำ
        ext = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4().hex}{ext}"
        save_path = os.path.join(UPLOAD_DIR, new_filename)

        # บันทึกไฟล์
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"msg": "Upload successful", "filename": new_filename}
    except Exception as e:
        return JSONResponse(content={"msg": "Upload failed", "error": str(e)}, status_code=500)
