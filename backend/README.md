# Institute Auth Backend

Flask backend for the Institute Authentication and Document Management System.

## Features

- **Institute Authentication**: Register and login for educational institutions
- **Document Management**: Upload and manage documents, certificates, and marksheets
- **Blockchain Verification**: Generate blockchain hashes and maintain ledger
- **PDF Processing**: Add watermarks and QR codes to documents
- **Document Verification**: Public API for verifying document authenticity

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
python app.py
```

The database will be created automatically on first run.

### Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new institute
- `POST /api/login` - Login institute

### Document Management
- `POST /api/upload_document` - Upload document (requires auth)
- `GET /api/documents` - List all documents (requires auth)
- `GET /api/documents/download/<doc_id>` - Download document (requires auth)
- `POST /api/verify_document` - Verify document (public)

## Document Types

1. **Document**: General documents
   - Fields: name, number (optional), issue_date

2. **Certificate**: Academic certificates
   - Fields: name, issue_date

3. **Marksheet**: Academic marksheets
   - Fields: name, exam_name, marks, issue_date

## File Structure

```
backend/
├── app.py                 # Main Flask application
├── models/               # Database models
│   ├── institute.py      # Institute model
│   └── document.py       # Document model
├── routes/               # API routes
│   ├── auth.py          # Authentication routes
│   └── documents.py     # Document management routes
├── utils/               # Utility functions
│   └── pdf_tools.py     # PDF processing utilities
├── blockchain/          # Blockchain functionality
│   └── ledger.py        # Ledger management
├── uploads/             # Temporary file storage
├── certificates/        # Processed document storage
├── ledger.json          # Blockchain ledger
└── requirements.txt     # Python dependencies
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///institute_auth.db
UPLOAD_FOLDER=uploads
CERT_OUTPUT_DIR=certificates
```

## Database Schema

### Institute Table
- id (Primary Key)
- name (String)
- email (String, Unique)
- password_hash (String)
- created_at (DateTime)
- updated_at (DateTime)

### Document Table
- id (Primary Key)
- institute_id (Foreign Key)
- doc_type (String: "document" | "certificate" | "marksheet")
- name (String)
- number (String, Optional)
- exam_name (String, Optional)
- marks (String, Optional)
- issue_date (Date)
- blockchain_hash (String)
- status (String)
- file_path (String)
- created_at (DateTime)
- updated_at (DateTime)

## Security Features

- JWT-based authentication
- Password hashing with Werkzeug
- File upload validation
- CORS enabled for frontend integration
- Input validation and sanitization

## Development

### Adding New Document Types

1. Update the `Document` model in `models/document.py`
2. Add validation in `routes/documents.py`
3. Update the frontend form schemas
4. Test the upload and verification flow

### Extending Blockchain Features

1. Modify `blockchain/ledger.py` for additional verification logic
2. Update `utils/pdf_tools.py` for enhanced PDF processing
3. Add new verification methods in the API

## Testing

Run the Flask development server and test endpoints using:

- Postman
- curl commands
- Frontend integration

## Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Use a production WSGI server (Gunicorn)
3. Configure proper database (PostgreSQL recommended)
4. Set up file storage (AWS S3 or similar)
5. Configure HTTPS and security headers
