# Backend API Requirements for data-processing-be

This document lists all API endpoints that the frontend expects from the backend.

## Base URL
- Production: `https://bwid-backend.onrender.com/api`
- Local: `http://localhost:8000/api`

---

## 1. FP&A / Excel Comparison Endpoints

### POST `/fpa/compare`
Compare two Excel files (previous vs current month)
- **Request**: `multipart/form-data`
  - `old_file`: Excel file (previous month)
  - `new_file`: Excel file (current month)
- **Response**:
  ```json
  {
    "statistics": {
      "new_rows": number,
      "updated_rows": number,
      "unchanged_rows": number
    },
    "output_file": string,
    "highlighted_file": string,
    "old_filename": string,
    "new_filename": string
  }
  ```

### GET `/fpa/download/{filename}`
Download result files
- **Response**: File download (blob)

---

## 2. Variance Analysis Endpoints

### GET `/health`
Health check endpoint
- **Response**: `{ "status": "healthy" }`

### POST `/process`
Process Python variance analysis
- **Request**: `multipart/form-data`
  - Excel files
  - Configuration parameters
- **Response**: Excel file (blob)

### POST `/start-analysis`
Start AI-powered variance analysis
- **Request**: `multipart/form-data`
  - Excel files
  - Configuration parameters
- **Response**:
  ```json
  {
    "session_id": string,
    "status": string
  }
  ```

### GET `/logs/{sessionId}` (EventSource/SSE)
Stream logs for AI analysis progress
- **Response**: Server-Sent Events stream

### GET `/download/{sessionId}`
Download analysis result
- **Response**: Excel file (blob)

### GET `/debug/list/{sessionId}`
List debug files for a session
- **Response**:
  ```json
  {
    "files": Array<{
      "key": string,
      "name": string,
      "size": number
    }>
  }
  ```

### GET `/debug/{fileKey}`
Download debug file
- **Response**: File download (blob)

---

## 3. Contract OCR Endpoints

### POST `/v1/contract-ocr/process-contracts-batch`
Process multiple contract files using OCR
- **Request**: `multipart/form-data`
  - `files`: Array of PDF/image files
- **Response**:
  ```json
  {
    "results": Array<{
      "file_name": string,
      "tenant": string,
      "contract_type": string,
      "monthly_rate": number,
      "start_date": string,
      "end_date": string,
      "processing_time": number,
      // ... other extracted fields
    }>,
    "total_files": number,
    "successful": number,
    "failed": number
  }
  ```

### GET `/v1/contract-ocr/health`
Health check for OCR service
- **Response**: `{ "status": "healthy" }`

### GET `/v1/contract-ocr/supported-formats`
Get supported file formats
- **Response**:
  ```json
  {
    "formats": ["pdf", "png", "jpg", "jpeg"]
  }
  ```

---

## 4. Utility Billing Endpoints

### POST `/v1/billing/session/create`
Create a new billing session
- **Response**:
  ```json
  {
    "session_id": string,
    "created_at": string
  }
  ```

### DELETE `/v1/billing/session/cleanup`
Cleanup a billing session
- **Headers**: `X-Session-ID`
- **Response**: `{ "status": "success" }`

### POST `/v1/billing/upload/input`
Upload CS input file
- **Headers**: `X-Session-ID`
- **Request**: `multipart/form-data`
  - `file`: Excel file
- **Response**:
  ```json
  {
    "filename": string,
    "size": number,
    "uploaded_at": string
  }
  ```

### POST `/v1/billing/upload/master-data`
Upload master data file
- **Headers**: `X-Session-ID`
- **Request**: `multipart/form-data`
  - `file`: Excel file
- **Response**:
  ```json
  {
    "filename": string,
    "type": string,
    "size": number
  }
  ```

### GET `/v1/billing/files/input`
List input files
- **Headers**: `X-Session-ID`
- **Response**:
  ```json
  {
    "files": Array<{
      "filename": string,
      "size": number,
      "uploaded_at": string
    }>
  }
  ```

### GET `/v1/billing/files/master-data`
List master data files
- **Headers**: `X-Session-ID`
- **Response**:
  ```json
  {
    "files": Array<{
      "filename": string,
      "type": string,
      "size": number
    }>
  }
  ```

### GET `/v1/billing/files/output`
List output files
- **Headers**: `X-Session-ID`
- **Response**:
  ```json
  {
    "files": Array<{
      "filename": string,
      "size": number,
      "created_at": string
    }>
  }
  ```

### DELETE `/v1/billing/files/{fileType}/{filename}`
Delete a file
- **Headers**: `X-Session-ID`
- **Params**: 
  - `fileType`: "input" | "master-data" | "output"
  - `filename`: string
- **Response**: `{ "status": "deleted" }`

### GET `/v1/billing/files/download/{fileType}/{filename}`
Download a file
- **Headers**: `X-Session-ID`
- **Response**: File download (blob)

### POST `/v1/billing/process`
Process billing data
- **Headers**: `X-Session-ID`
- **Request**:
  ```json
  {
    "input_files": Array<string> (optional)
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "summary": {
      "input_records": number,
      "invoices_generated": number,
      "line_items": number,
      "validation_issues": number
    }
  }
  ```

### GET `/v1/billing/status`
Get system status
- **Headers**: `X-Session-ID`
- **Response**:
  ```json
  {
    "input_files": number,
    "output_files": number,
    "processing_status": string
  }
  ```

### GET `/v1/billing/master-data/status`
Get master data status
- **Headers**: `X-Session-ID`
- **Response**:
  ```json
  {
    "customers": {
      "loaded": boolean,
      "count": number,
      "last_updated": string
    },
    "units": { ... },
    "config": { ... }
  }
  ```

### GET `/v1/billing/health`
Health check
- **Response**: `{ "status": "healthy" }`

---

## Common Response Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

```json
{
  "detail": string,
  "error": string (optional),
  "status_code": number
}
```

---

## Notes for Backend Implementation

1. All endpoints should support CORS for `http://localhost:5173` (dev) and your production domain
2. File uploads should have appropriate size limits (suggest 100MB max)
3. Session-based endpoints require `X-Session-ID` header
4. SSE endpoint (`/logs/{sessionId}`) should keep connection alive
5. All `/api` prefix is already in the base URL, don't add it again in routes
6. Blob responses should set appropriate `Content-Type` and `Content-Disposition` headers

