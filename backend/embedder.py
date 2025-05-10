import tiktoken

def chunk_text(text, max_tokens=500):
    enc = tiktoken.get_encoding("cl100k_base")
    words = text.split('. ')
    chunks = []
    current_chunk = []

    for sentence in words:
        if enc.encode(' '.join(current_chunk + [sentence])).__len__() <= max_tokens:
            current_chunk.append(sentence)
        else:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks
