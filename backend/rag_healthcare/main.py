"""
Main entry point: CLI interface for the Healthcare RAG system.
- Auto-ingests data on first run
- Interactive query loop
- Uses RAGEngine and ReportGenerator
"""

import os
import sys
from pathlib import Path

# Import local modules
from ingest import ingest_patients, get_collection_size, get_or_create_chroma_client
from rag_engine import RAGEngine
from report_generator import generate_and_save_report

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
CHROMA_DIR = BACKEND_DIR / "chroma_db"
DB_JSON_PATH = BASE_DIR / "db.json"
REPORTS_DIR = PROJECT_ROOT / "reports"


def print_banner():
    """Print startup banner."""
    print("\n")
    print("╔" + "=" * 70 + "╗")
    print("║" + " " * 70 + "║")
    print("║" + "  🏥 HEALTHCARE RAG SYSTEM — LLM-Ready Pipeline  ".center(70) + "║")
    print("║" + "  Retrieval-Augmented Generation for Medical Data  ".center(70) + "║")
    print("║" + " " * 70 + "║")
    print("╚" + "=" * 70 + "╝")
    print()


def check_and_ingest():
    """Check if data needs ingestion; ingest if necessary."""
    persist_dir = str(CHROMA_DIR)
    
    print("Checking database state...")
    
    try:
        client = get_or_create_chroma_client(persist_dir)
        collection = client.get_collection(name="healthcare_rag")
        count = get_collection_size(collection)
        
        if count == 0:
            print(f"✓ Collection exists but is empty ({count} docs).")
            print("\nInitiating auto-ingestion...")
            ingest_patients(db_path=str(DB_JSON_PATH), persist_dir=persist_dir)
        else:
            print(f"✓ Database ready ({count} patient records indexed)")
    except Exception:
        # Collection doesn't exist, run full ingest
        print("✓ No existing database found.")
        print("\nInitiating ingestion...")
        ingest_patients(db_path=str(DB_JSON_PATH), persist_dir=persist_dir)


def print_help():
    """Print help information."""
    help_text = """
HEALTHCARE RAG SYSTEM — QUERY HELP
================================

EXAMPLE QUERIES:
  • "Which patients have diabetes?"
  • "Show patients with high blood pressure"
  • "What are the lab results for anemia patients?"
  • "Summarize Priya Sharma's condition"
  • "Patients from Apollo Hospital"
  • "Who has thyroid issues?"
  • "List all cardiac patients"

COMMANDS:
  help    - Show this help message
  quit    - Exit the system
  [query] - Execute a RAG search query

HOW IT WORKS:
  1. Your query is searched using hybrid retrieval (BM25 + semantic search)
  2. Top matching patient records are retrieved from ChromaDB
  3. An LLM-ready prompt is built with retrieved context
  4. Output shows matched patients and the full prompt
  5. LLM API can be plugged in later to generate final answers

STATUS:
  ✓ Retrieval: ENABLED (hybrid search)
  ✓ Prompt Generation: ENABLED (LLM-ready)
  ⧖ LLM API: NOT CONNECTED (coming soon)

REPORTS:
  All query results are saved to ./reports/ with timestamps
================================
"""
    print(help_text)


def run_query_loop():
    """Run interactive query loop."""
    print("\n" + "=" * 70)
    print("INTERACTIVE QUERY MODE")
    print("=" * 70)
    print("Type 'help' for usage, 'quit' to exit, or enter your medical query.\n")
    
    engine = RAGEngine(persist_dir=str(CHROMA_DIR))
    
    while True:
        try:
            user_input = input("🔍 Enter query (or 'help'/'quit'): ").strip()
            
            if not user_input:
                print("  ⚠️  Please enter a query.\n")
                continue
            
            if user_input.lower() == 'quit':
                print("\n👋 Thank you for using Healthcare RAG System!")
                break
            
            if user_input.lower() == 'help':
                print_help()
                continue
            
            # Process query
            print("\n⏳ Processing query...")
            result = engine.answer(user_input, top_k=5)
            
            # Generate and save report
            print()
            generate_and_save_report(result, save_to_disk=True, reports_dir=str(REPORTS_DIR))
            
            print("\n" + "=" * 70 + "\n")
            
        except KeyboardInterrupt:
            print("\n\n👋 Exiting...")
            break
        except Exception as e:
            print(f"\n❌ Error processing query: {e}\n")


def main():
    """Main entry point."""
    print_banner()
    
    # Check and ingest data if needed
    try:
        check_and_ingest()
    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        sys.exit(1)
    
    # Run interactive loop
    try:
        run_query_loop()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
