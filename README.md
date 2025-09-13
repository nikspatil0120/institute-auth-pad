# Institute Authentication Platform

## Project Overview

This is an Institute Authentication Platform built with modern web technologies for secure document management, certificate issuance, and verification.

## How to run this project locally

**Prerequisites**

Make sure you have Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

**Setup Steps**

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd institute-auth-pad

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

**Backend Setup**

```sh
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the Flask application
python app.py
```

## What technologies are used for this project?

This project is built with:

**Frontend:**
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router

**Backend:**
- Python Flask
- SQLAlchemy
- Blockchain integration
- OCR processing
- Fraud detection

## Features

- **Document Management**: Upload, process, and manage student documents
- **Certificate Issuance**: Issue digital certificates with blockchain verification
- **Document Verification**: Verify document authenticity using blockchain
- **OCR Processing**: Extract text from uploaded documents
- **Fraud Detection**: AI-powered fraud detection for documents
- **Legacy Document Support**: Handle legacy document formats
- **Admin Dashboard**: Comprehensive admin interface for institute management

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   ├── services/          # API services
│   └── lib/               # Utility functions
├── backend/               # Python Flask backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
└── public/                # Static assets
```

## Development

- **Frontend**: Runs on `http://localhost:8080`
- **Backend**: Runs on `http://localhost:5000`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.