from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
import httpx
import numpy as np
import statistics

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class WebhookRequest(BaseModel):
    url: str

class AnalyticsRequest(BaseModel):
    session_id: str
    columns: List[str]

class ColumnStats(BaseModel):
    column: str
    data_type: str
    count: int
    non_null_count: int
    unique_count: int
    # Numeric stats
    sum: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    std_dev: Optional[float] = None
    variance: Optional[float] = None
    percentile_25: Optional[float] = None
    percentile_50: Optional[float] = None
    percentile_75: Optional[float] = None
    percentile_90: Optional[float] = None
    # Categorical stats
    value_counts: Optional[Dict[str, int]] = None
    mode: Optional[str] = None

class DataSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    data: List[Dict[str, Any]]
    columns: List[str]
    column_types: Dict[str, str]
    row_count: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def detect_column_type(values: List[Any]) -> str:
    """Detect the data type of a column based on its values."""
    non_null_values = [v for v in values if v is not None and v != '']
    if not non_null_values:
        return 'empty'
    
    numeric_count = 0
    date_count = 0
    
    for val in non_null_values[:100]:  # Sample first 100 values
        try:
            float(val)
            numeric_count += 1
        except (ValueError, TypeError):
            pass
        
        if isinstance(val, str):
            # Check for date patterns
            date_patterns = ['-', '/', ':']
            if any(p in str(val) for p in date_patterns) and len(str(val)) >= 8:
                date_count += 1
    
    sample_size = min(len(non_null_values), 100)
    if numeric_count / sample_size >= 0.8:
        return 'numeric'
    elif date_count / sample_size >= 0.5:
        return 'date'
    else:
        return 'categorical'

def calculate_numeric_stats(values: List[Any]) -> Dict[str, Any]:
    """Calculate statistics for numeric columns."""
    numeric_values = []
    for v in values:
        if v is not None and v != '':
            try:
                numeric_values.append(float(v))
            except (ValueError, TypeError):
                pass
    
    if not numeric_values:
        return {}
    
    sorted_vals = sorted(numeric_values)
    n = len(sorted_vals)
    
    def percentile(data, p):
        k = (len(data) - 1) * p / 100
        f = int(k)
        c = f + 1 if f < len(data) - 1 else f
        return data[f] + (k - f) * (data[c] - data[f]) if c < len(data) else data[f]
    
    stats = {
        'sum': sum(numeric_values),
        'mean': statistics.mean(numeric_values),
        'median': statistics.median(numeric_values),
        'min_val': min(numeric_values),
        'max_val': max(numeric_values),
        'percentile_25': percentile(sorted_vals, 25),
        'percentile_50': percentile(sorted_vals, 50),
        'percentile_75': percentile(sorted_vals, 75),
        'percentile_90': percentile(sorted_vals, 90),
    }
    
    if n > 1:
        stats['std_dev'] = statistics.stdev(numeric_values)
        stats['variance'] = statistics.variance(numeric_values)
    else:
        stats['std_dev'] = 0
        stats['variance'] = 0
    
    return stats

def calculate_categorical_stats(values: List[Any]) -> Dict[str, Any]:
    """Calculate statistics for categorical columns."""
    non_null_values = [str(v) for v in values if v is not None and v != '']
    
    if not non_null_values:
        return {}
    
    value_counts = {}
    for v in non_null_values:
        value_counts[v] = value_counts.get(v, 0) + 1
    
    # Sort by count and limit to top 20
    sorted_counts = dict(sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:20])
    
    mode = max(value_counts.items(), key=lambda x: x[1])[0] if value_counts else None
    
    return {
        'value_counts': sorted_counts,
        'mode': mode
    }

def get_distribution_data(values: List[Any], col_type: str) -> List[Dict[str, Any]]:
    """Get distribution data for charts."""
    if col_type == 'numeric':
        numeric_values = []
        for v in values:
            if v is not None and v != '':
                try:
                    numeric_values.append(float(v))
                except (ValueError, TypeError):
                    pass
        
        if not numeric_values:
            return []
        
        # Create histogram bins
        min_val = min(numeric_values)
        max_val = max(numeric_values)
        
        if min_val == max_val:
            return [{'range': str(min_val), 'count': len(numeric_values)}]
        
        num_bins = min(10, len(set(numeric_values)))
        bin_width = (max_val - min_val) / num_bins
        
        bins = []
        for i in range(num_bins):
            bin_start = min_val + i * bin_width
            bin_end = min_val + (i + 1) * bin_width
            count = sum(1 for v in numeric_values if bin_start <= v < bin_end or (i == num_bins - 1 and v == max_val))
            bins.append({
                'range': f'{bin_start:.2f}-{bin_end:.2f}',
                'count': count,
                'start': bin_start,
                'end': bin_end
            })
        
        return bins
    else:
        # Categorical distribution
        non_null_values = [str(v) for v in values if v is not None and v != '']
        value_counts = {}
        for v in non_null_values:
            value_counts[v] = value_counts.get(v, 0) + 1
        
        sorted_items = sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return [{'name': k, 'value': v} for k, v in sorted_items]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Analytics Dashboard API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

@api_router.post("/fetch-data")
async def fetch_webhook_data(request: WebhookRequest):
    """Fetch data from webhook URL and store in session."""
    try:
        # Use longer timeout and follow redirects for Google Apps Script
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as http_client:
            response = await http_client.get(request.url)
            response.raise_for_status()
            
            try:
                data = response.json()
            except Exception as e:
                logger.error(f"JSON parse error: {e}")
                raise HTTPException(status_code=400, detail="Invalid JSON response from webhook")
        
        # Handle Google Apps Script format: {headers: [], rows: []}
        if isinstance(data, dict) and 'headers' in data and 'rows' in data:
            headers = data['headers']
            rows = data['rows']
            # Convert to array of objects if rows are arrays
            if rows and isinstance(rows[0], list):
                data = [dict(zip(headers, row)) for row in rows]
            elif rows and isinstance(rows[0], dict):
                # Rows are already objects, use as-is
                data = rows
            else:
                data = rows
        # Handle other JSON structures
        elif isinstance(data, dict):
            # Check for common data wrapper keys
            for key in ['data', 'rows', 'items', 'records', 'results', 'values']:
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break
            else:
                # If it's a single object, wrap it in a list
                if not isinstance(data, list):
                    data = [data]
        
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="Data must be an array of objects")
        
        if len(data) == 0:
            raise HTTPException(status_code=400, detail="No data found in response")
        
        # Extract columns from first row
        first_row = data[0] if data else {}
        if not isinstance(first_row, dict):
            raise HTTPException(status_code=400, detail="Each row must be an object")
        
        columns = list(first_row.keys())
        
        # Detect column types
        column_types = {}
        for col in columns:
            values = [row.get(col) for row in data]
            column_types[col] = detect_column_type(values)
        
        # Create session
        session_id = str(uuid.uuid4())
        session_doc = {
            'id': session_id,
            'url': request.url,
            'data': data,
            'columns': columns,
            'column_types': column_types,
            'row_count': len(data),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        await db.data_sessions.insert_one(session_doc)
        
        return {
            'session_id': session_id,
            'columns': columns,
            'column_types': column_types,
            'row_count': len(data),
            'preview': data[:100]  # Return first 100 rows for preview
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching webhook: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch data: HTTP {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to webhook URL: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session data by ID."""
    session = await db.data_sessions.find_one({'id': session_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@api_router.get("/session/{session_id}/data")
async def get_session_data(session_id: str, page: int = 1, page_size: int = 50):
    """Get paginated session data."""
    session = await db.data_sessions.find_one({'id': session_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = session.get('data', [])
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        'data': data[start:end],
        'total': len(data),
        'page': page,
        'page_size': page_size,
        'total_pages': (len(data) + page_size - 1) // page_size
    }

@api_router.post("/analyze")
async def analyze_columns(request: AnalyticsRequest):
    """Analyze selected columns and return statistics."""
    session = await db.data_sessions.find_one({'id': request.session_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = session.get('data', [])
    column_types = session.get('column_types', {})
    
    results = []
    for col in request.columns:
        if col not in session.get('columns', []):
            continue
        
        values = [row.get(col) for row in data]
        col_type = column_types.get(col, 'categorical')
        
        non_null = [v for v in values if v is not None and v != '']
        unique_values = set(str(v) for v in non_null)
        
        stats = {
            'column': col,
            'data_type': col_type,
            'count': len(values),
            'non_null_count': len(non_null),
            'unique_count': len(unique_values),
        }
        
        if col_type == 'numeric':
            numeric_stats = calculate_numeric_stats(values)
            stats.update(numeric_stats)
        else:
            categorical_stats = calculate_categorical_stats(values)
            stats.update(categorical_stats)
        
        # Add distribution data for charts
        stats['distribution'] = get_distribution_data(values, col_type)
        
        # Add trend data (for line charts if numeric)
        if col_type == 'numeric':
            numeric_values = []
            for i, v in enumerate(values):
                if v is not None and v != '':
                    try:
                        numeric_values.append({'index': i, 'value': float(v)})
                    except (ValueError, TypeError):
                        pass
            stats['trend_data'] = numeric_values[:500]  # Limit to 500 points
        
        results.append(stats)
    
    # Save analytics to session
    await db.data_sessions.update_one(
        {'id': request.session_id},
        {'$set': {'analytics': results, 'analyzed_columns': request.columns}}
    )
    
    return {'analytics': results}

@api_router.get("/session/{session_id}/analytics")
async def get_session_analytics(session_id: str):
    """Get stored analytics for a session."""
    session = await db.data_sessions.find_one({'id': session_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        'analytics': session.get('analytics', []),
        'analyzed_columns': session.get('analyzed_columns', [])
    }

@api_router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    result = await db.data_sessions.delete_one({'id': session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {'message': 'Session deleted successfully'}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
