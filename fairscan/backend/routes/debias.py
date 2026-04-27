"""
FastAPI router for the three-way debias comparison endpoint.
Registered in main.py with prefix="/api", so the route decorator here
is "/debias-compare" (final URL: /api/debias-compare).
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.debias_compare import run_all_methods

router = APIRouter()


class DebiasCompareRequest(BaseModel):
    model_file: str
    dataset_csv: str
    protected_attributes: List[str]
    # Kept for backwards-compatibility with the single-method endpoint; ignored here
    # since we always return all three.
    fairness_metric: Optional[str] = None
    penalty_weight: Optional[float] = None


@router.post("/debias-compare")
def debias_compare(body: DebiasCompareRequest):
    if not body.protected_attributes:
        raise HTTPException(status_code=400, detail="protected_attributes must not be empty.")

    protected_attribute = body.protected_attributes[0]
    try:
        return run_all_methods(
            model_b64=body.model_file,
            dataset_csv_b64=body.dataset_csv,
            protected_attribute=protected_attribute,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Debias comparison failed: {exc}") from exc
