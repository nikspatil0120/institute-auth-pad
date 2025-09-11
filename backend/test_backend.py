#!/usr/bin/env python3
"""
Simple test script to verify backend setup
"""

def test_imports():
    """Test if all modules can be imported"""
    try:
        print("Testing imports...")
        
        # Test database
        from database import db
        print("✅ Database import successful")
        
        # Test models
        from models.institute import Institute
        from models.document import Document
        print("✅ Models import successful")
        
        # Test routes
        from routes.auth import auth_bp
        from routes.documents import documents_bp
        print("✅ Routes import successful")
        
        # Test utilities
        from utils.pdf_tools import generate_blockchain_hash
        print("✅ PDF tools import successful")
        
        # Test blockchain
        from blockchain.ledger import load_ledger
        print("✅ Blockchain import successful")
        
        print("\n🎉 All imports successful! Backend is ready.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_basic_functionality():
    """Test basic functionality"""
    try:
        print("\nTesting basic functionality...")
        
        # Test blockchain hash generation
        from utils.pdf_tools import generate_blockchain_hash
        test_data = {"test": "data", "number": 123}
        hash_result = generate_blockchain_hash(test_data)
        
        if hash_result and len(hash_result) == 64:
            print("✅ Blockchain hash generation working")
        else:
            print("❌ Blockchain hash generation failed")
            return False
        
        # Test ledger operations
        from blockchain.ledger import load_ledger, save_ledger
        ledger = load_ledger()
        print("✅ Ledger operations working")
        
        print("\n🎉 Basic functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Functionality test failed: {e}")
        return False

if __name__ == "__main__":
    print("Backend Test Suite")
    print("=" * 50)
    
    # Run tests
    imports_ok = test_imports()
    
    if imports_ok:
        functionality_ok = test_basic_functionality()
        
        if functionality_ok:
            print("\n🚀 Backend is ready to run!")
            print("Run: python app.py")
        else:
            print("\n⚠️  Some functionality issues detected")
    else:
        print("\n❌ Import issues detected. Please check dependencies.")
