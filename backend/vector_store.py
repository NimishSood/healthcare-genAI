import os
from dotenv import load_dotenv
load_dotenv()  # ✅ Load variables from .env

from openai import OpenAI
import faiss
import numpy as np

# ✅ Initialize OpenAI with API key from env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

embedding_model = "text-embedding-3-small"
dimension = 1536

# Global in-memory FAISS index
index = faiss.IndexFlatL2(dimension)
chunk_map = []  # Holds matching text chunks

def embed_text(text):
    response = client.embeddings.create(
        model=embedding_model,
        input=[text]
    )
    return np.array(response.data[0].embedding, dtype=np.float32)

def index_chunks(chunks):
    global chunk_map
    embeddings = [embed_text(c) for c in chunks]
    index.add(np.array(embeddings))
    chunk_map = chunks

def get_top_chunks(query, top_k=3):
    q_embed = embed_text(query).reshape(1, -1)
    D, I = index.search(q_embed, top_k)
    return [chunk_map[i] for i in I[0] if i < len(chunk_map)]
