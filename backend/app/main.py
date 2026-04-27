from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .routes import upload, train, predict, bias, mitigate

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FairShield API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(train.router, prefix="/train", tags=["Train"])
app.include_router(predict.router, prefix="/predict", tags=["Predict"])
app.include_router(bias.router, prefix="/bias", tags=["Bias"])
app.include_router(mitigate.router, prefix="/mitigate", tags=["Mitigate"])

@app.get("/")
async def root():
    return {"message": "Welcome to FairShield API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8081, reload=True)
