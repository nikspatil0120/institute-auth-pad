import os
import json
import hashlib
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from reportlab.lib.utils import ImageReader
from PyPDF2 import PdfReader, PdfWriter
import qrcode
from io import BytesIO

def add_watermark_and_qr(input_pdf_path, output_pdf_path, watermark_text, qr_data):
    """
    Add watermark text and QR code to PDF
    
    Args:
        input_pdf_path: Path to input PDF
        output_pdf_path: Path to output PDF
        watermark_text: Text to watermark
        qr_data: Dictionary containing data for QR code
    """
    try:
        # Read input PDF
        reader = PdfReader(input_pdf_path)
        writer = PdfWriter()
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Process each page
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            
            # Create watermark canvas
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            
            # Get page dimensions
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            
            # Add diagonal watermark
            can.saveState()
            can.setFillColor(Color(0.8, 0.8, 0.8, 0.3))  # Light gray with transparency
            can.setFont("Helvetica-Bold", 20)
            
            # Rotate and position watermark
            can.rotate(45)
            can.drawString(100, -100, watermark_text)
            can.restoreState()
            
            # Add QR code in center bottom
            qr_size = 120
            qr_x = (page_width - qr_size) / 2
            qr_y = 20
            
            can.drawImage(
                ImageReader(qr_buffer),
                qr_x, qr_y,
                width=qr_size,
                height=qr_size
            )
            
            can.save()
            
            # Merge watermark with page
            packet.seek(0)
            watermark_pdf = PdfReader(packet)
            watermark_page = watermark_pdf.pages[0]
            
            # Merge pages
            page.merge_page(watermark_page)
            writer.add_page(page)

        # Also embed QR data into PDF metadata for fast verification
        try:
            writer.add_metadata({"/QRData": json.dumps(qr_data)})
        except Exception:
            pass
        
        # Write output PDF
        with open(output_pdf_path, 'wb') as output_file:
            writer.write(output_file)
            
        return True
        
    except Exception as e:
        print(f"Error adding watermark and QR code: {str(e)}")
        return False

def generate_blockchain_hash(payload):
    """
    Generate SHA-256 hash of canonical JSON string
    
    Args:
        payload: Dictionary to hash
        
    Returns:
        str: SHA-256 hash
    """
    try:
        # Create canonical JSON string (sorted keys)
        canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        
        # Generate SHA-256 hash
        hash_object = hashlib.sha256(canonical_json.encode('utf-8'))
        return hash_object.hexdigest()
        
    except Exception as e:
        print(f"Error generating blockchain hash: {str(e)}")
        return None
