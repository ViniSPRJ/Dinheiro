from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

from app.services.categorizer import CategorySuggestionService
from app.services.receipt_parser import extract_text, parse_receipt_fields

load_dotenv()

app = FastAPI(
    title="Dinheiro ML Service",
    description="AI-powered transaction categorization service",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
categorizer = CategorySuggestionService()


class CategorySuggestionRequest(BaseModel):
    description: str
    user_id: str
    amount: Optional[float] = None
    account_type: Optional[str] = None


class CategorySuggestionResponse(BaseModel):
    category_id: str
    category_name: str
    confidence: float
    alternatives: List[dict]


class RetrainRequest(BaseModel):
    user_id: str
    transaction_id: str
    description: str
    correct_category_id: str
    correct_category_name: str


class HealthResponse(BaseModel):
    status: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", version="1.0.0")


@app.post("/ml/suggest-category", response_model=CategorySuggestionResponse)
async def suggest_category(request: CategorySuggestionRequest):
    """
    Suggest a category for a transaction based on its description.
    Uses ML model trained on user's historical data and global patterns.
    """
    try:
        result = categorizer.suggest_category(
            description=request.description,
            user_id=request.user_id,
            amount=request.amount,
            account_type=request.account_type,
        )
        return CategorySuggestionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ml/retrain")
async def retrain_model(request: RetrainRequest):
    """
    Add a new training example and retrain the user's model.
    Called when a user corrects a category suggestion.
    """
    try:
        categorizer.add_training_example(
            user_id=request.user_id,
            transaction_id=request.transaction_id,
            description=request.description,
            category_id=request.correct_category_id,
            category_name=request.correct_category_name,
        )
        return {"status": "success", "message": "Training example added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ml/model-status/{user_id}")
async def get_model_status(user_id: str):
    """Get the status of a user's ML model"""
    try:
        status = categorizer.get_model_status(user_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ItemExtractionRequest(BaseModel):
    description: str

class ItemExtractionResponse(BaseModel):
    item: Optional[str]
    type: Optional[str]
    confidence: float
    source: str

@app.post("/ml/extract-entities", response_model=ItemExtractionResponse)
async def extract_entities(request: ItemExtractionRequest):
    """
    Extract consumption entities from transaction description.
    Uses Semantic NLP to identify canonical items (e.g. "Gasolina", "Streaming").
    """
    try:
        result = categorizer.extract_entities(request.description)
        if not result:
            return ItemExtractionResponse(
                 item=None,
                 type=None,
                 confidence=0.0,
                 source="none"
            )
            
        return ItemExtractionResponse(
            item=result.get("item"),
            type=result.get("type"),
            confidence=result.get("confidence", 0.0),
            source=result.get("source", "rule_based")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReceiptExtractionResponse(BaseModel):
    amount: Optional[float]
    date: Optional[str]
    merchant: Optional[str]
    raw_text: str
    category_suggestion: Optional[dict]


@app.post("/ml/extract-from-receipt", response_model=ReceiptExtractionResponse)
async def extract_from_receipt(user_id: str = Form(...), file: UploadFile = File(...)):
    """
    OCRs a receipt photo/PDF, extracts amount/date/merchant, and reuses the
    existing categorizer to suggest a transaction category from the merchant
    text -- the same suggest_category() path text-entered transactions use.
    """
    try:
        file_bytes = await file.read()
        raw_text = extract_text(file_bytes, file.content_type or "")
        fields = parse_receipt_fields(raw_text)

        category_suggestion = None
        if fields["merchant"]:
            try:
                category_suggestion = categorizer.suggest_category(
                    description=fields["merchant"],
                    user_id=user_id,
                    amount=fields["amount"],
                )
            except Exception:
                category_suggestion = None

        return ReceiptExtractionResponse(
            amount=fields["amount"],
            date=fields["date"],
            merchant=fields["merchant"],
            raw_text=raw_text,
            category_suggestion=category_suggestion,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
