import sys
import traceback

print("Testing RAG engine initialization...")
try:
    from rag_healthcare.rag_engine import RAGEngine
    print("Imported RAGEngine")
    engine = RAGEngine(persist_dir='./chroma_db')
    print("Initialized RAGEngine")
    res = engine.answer('hi', top_k=1)
    print("Got response:", res)
except Exception as e:
    print("Exception:")
    traceback.print_exc()
