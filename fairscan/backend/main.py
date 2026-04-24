import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.debias import router as debias_router

# Comma-separated list of allowed origins (e.g. for Cloud Run set
# ALLOWED_ORIGINS="https://fairscan.example.com,https://fairscan-staging.example.com").
# Default covers local Vite dev on 5173/5174.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(title="FairScan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")
app.include_router(debias_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "FairScan API is running"}


if __name__ == "__main__":
    # Cloud Run injects PORT; fall back to 8000 locally.
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
