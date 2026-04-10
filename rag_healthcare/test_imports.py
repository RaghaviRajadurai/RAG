#!/usr/bin/env python3
"""Test if all required packages are installed"""

packages = {
    'chromadb': 'Vector database',
    'sentence_transformers': 'Embedding model',
    'rank_bm25': 'BM25 search',
    'numpy': 'Numerical computing'
}

all_good = True
for pkg_name, description in packages.items():
    try:
        __import__(pkg_name)
        print(f"✓ {pkg_name:25} - {description}")
    except ImportError as e:
        print(f"✗ {pkg_name:25} - {description} [MISSING]")
        all_good = False

if all_good:
    print("\n✅ All packages ready! Run: python main.py")
else:
    print("\n⚠️ Some packages missing. Install with: pip install -r requirements.txt")
