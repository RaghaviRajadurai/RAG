import sys
import traceback

print("Testing imports...")
try:
    print("Importing sentence_transformers...")
    import sentence_transformers
    print("Importing chromadb...")
    import chromadb
    print("Importing rank_bm25...")
    import rank_bm25
    print("All good!")
except Exception as e:
    traceback.print_exc()
