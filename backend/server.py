from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CompressionResult(BaseModel):
    file_id: str
    original_name: str
    original_size: int
    compressed_size: int
    compression_ratio: float
    message: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "SkyCodec API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/compress", response_model=CompressionResult)
async def compress_file(file: UploadFile = File(...)):
    """
    Upload and compress file endpoint.
    Currently returns mock compression data.
    TODO: Implement actual SkyCodec compression algorithm here.
    """
    # Validate file size (10MB limit)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    # Save original file
    original_path = UPLOADS_DIR / f"{file_id}_original_{file.filename}"
    with open(original_path, "wb") as f:
        f.write(content)
    
    # TODO: Implement actual SkyCodec compression algorithm
    # For now, simulate compression with mock data
    # The compressed file should be saved as: {file_id}_compressed_{filename}
    
    # Mock compression: simulate 60-80% compression ratio
    import random
    compression_ratio = random.uniform(0.6, 0.8)
    compressed_size = int(file_size * compression_ratio)
    
    # Save mock compressed file (copy for now, replace with actual compression)
    compressed_path = UPLOADS_DIR / f"{file_id}_compressed_{file.filename}"
    shutil.copy(original_path, compressed_path)
    
    # Store compression info in database
    compression_doc = {
        "file_id": file_id,
        "original_name": file.filename,
        "original_size": file_size,
        "compressed_size": compressed_size,
        "compression_ratio": compression_ratio,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.compressions.insert_one(compression_doc)
    
    return CompressionResult(
        file_id=file_id,
        original_name=file.filename,
        original_size=file_size,
        compressed_size=compressed_size,
        compression_ratio=compression_ratio,
        message="File compressed successfully"
    )

@api_router.get("/download/{file_id}")
async def download_compressed_file(file_id: str):
    """
    Download compressed file endpoint.
    TODO: Serve the actual compressed file once compression algorithm is implemented.
    """
    # Find compression record
    compression_record = await db.compressions.find_one({"file_id": file_id}, {"_id": 0})
    
    if not compression_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Build compressed file path
    compressed_filename = f"{file_id}_compressed_{compression_record['original_name']}"
    compressed_path = UPLOADS_DIR / compressed_filename
    
    if not compressed_path.exists():
        raise HTTPException(status_code=404, detail="Compressed file not found")
    
    # Return file for download
    return FileResponse(
        path=str(compressed_path),
        filename=f"compressed_{compression_record['original_name']}",
        media_type="application/octet-stream"
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()