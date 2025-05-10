from flask import Flask, request, jsonify
from flask_cors import CORS  # Enables cross-origin requests (needed for React)
from dotenv import load_dotenv  # Loads environment variables from .env
import os
from openai import OpenAI  # OpenAI Python SDK

# Local utility modules
from pdf_parser import extract_text_from_pdf
from embedder import chunk_text
from vector_store import index_chunks, get_top_chunks

# Initialize Flask app
app = Flask(__name__)

# Enable CORS so React (localhost:5173) can access Flask (localhost:5000)
CORS(app)

# Load OpenAI key from .env file
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Path where the latest uploaded patient data is saved
UPLOAD_PATH = "uploaded_patient_data.txt"

# -----------------------------
# Upload Endpoint
# -----------------------------
@app.route("/upload", methods=["POST"])
def upload():
    """
    Accepts a patient file (.txt or .pdf), extracts text,
    chunks and embeds it, and stores it for future chat queries.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    file_ext = file.filename.split('.')[-1].lower()

    # Extract text depending on file type
    if file_ext == "txt":
        text = file.read().decode("utf-8")
    elif file_ext == "pdf":
        temp_path = "temp.pdf"
        file.save(temp_path)
        text = extract_text_from_pdf(temp_path)
        os.remove(temp_path)
    else:
        return jsonify({"error": "Only .txt or .pdf files are supported"}), 400

    # Save raw patient text to disk
    with open(UPLOAD_PATH, "w", encoding="utf-8") as f:
        f.write(text)

    # Convert text to vector chunks using OpenAI embeddings
    chunks = chunk_text(text)
    index_chunks(chunks)

    return jsonify({"message": "File uploaded, parsed, and embedded successfully."})

# -----------------------------
# Chat Endpoint
# -----------------------------
@app.route("/chat", methods=["POST"])
def chat():
    """
    Accepts a natural language question and responds using
    only the most relevant chunks of the uploaded patient file.
    """
    data = request.get_json()
    doctor_prompt = data.get("message")

    # Validate file presence
    if not os.path.exists(UPLOAD_PATH):
        return jsonify({"error": "No patient data uploaded."}), 400

    # Search most relevant parts of the document
    top_chunks = get_top_chunks(doctor_prompt, top_k=3)
    context = "\n\n".join(top_chunks)

    # Final prompt for GPT
    full_prompt = f"""You are a helpful AI doctor assistant.
Use only the following patient data to answer the question:

{context}

Doctor's question: {doctor_prompt}
Answer:"""

    # Ask OpenAI GPT-3.5 using the constructed prompt
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": full_prompt}
        ]
    )

    reply = response.choices[0].message.content.strip()
    return jsonify({"reply": reply})

# -----------------------------
# App Entry Point
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
