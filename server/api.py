from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import Pyro5.api

app = FastAPI()

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:3000"],  # Allow both ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get Pyro5 proxy
file_service = Pyro5.api.Proxy("PYRO:file.service@localhost:9999")  # Changed Pyro5 port

@app.get("/api/files/list")
async def list_files(path: str = ""):
    try:
        return file_service.list_directory(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/read")
async def read_file(path: str):
    try:
        return file_service.read_file(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
