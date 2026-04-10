"""
Retriever module: Hybrid retrieval using BM25 keyword search and semantic similarity.
Combines both methods with re-ranking for better results.
"""

import json
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import chromadb
import numpy as np


class HybridRetriever:
    """
    Hybrid retriever combining BM25 keyword search and semantic similarity.
    """
    
    def __init__(self, persist_dir: str = "./chroma_db"):
        """
        Initialize the hybrid retriever with ChromaDB and embeddings.
        
        Args:
            persist_dir: Directory path for ChromaDB persistence
        """
        # Load embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB with new API
        self.chroma_client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.chroma_client.get_collection(name="healthcare_rag")
        
        # Load all documents for BM25
        self._load_documents_for_bm25()
    
    def _load_documents_for_bm25(self):
        """Load all documents from ChromaDB and prepare for BM25 ranking."""
        results = self.collection.get(
            include=["documents", "metadatas"]
        )
        
        self.doc_ids = results['ids']
        self.doc_texts = results['documents']
        self.doc_metadatas = results['metadatas']
        
        # Tokenize documents for BM25
        tokenized_docs = [doc.lower().split() for doc in self.doc_texts]
        self.bm25 = BM25Okapi(tokenized_docs)
    
    def _bm25_search(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        Perform BM25 keyword search.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of results with patient_id, text, and BM25 score
        """
        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        
        # Get top-k indices
        top_indices = np.argsort(bm25_scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if bm25_scores[idx] > 0:  # Only include if score > 0
                results.append({
                    'patient_id': self.doc_ids[idx],
                    'name': self.doc_metadatas[idx].get('name', 'Unknown'),
                    'condition': self.doc_metadatas[idx].get('condition', 'Unknown'),
                    'hospital': self.doc_metadatas[idx].get('hospital', 'Unknown'),
                    'chunk_text': self.doc_texts[idx],
                    'bm25_score': float(bm25_scores[idx]),
                })
        
        return results
    
    def _semantic_search(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        Perform semantic similarity search using ChromaDB.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of results with patient_id, text, and similarity score
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        retrieved = []
        if results['ids'] and len(results['ids']) > 0:
            for i, doc_id in enumerate(results['ids'][0]):
                # Convert distance to similarity (cosine distance -> similarity)
                distance = results['distances'][0][i]
                similarity = 1 - distance  # For cosine distance
                
                retrieved.append({
                    'patient_id': doc_id,
                    'name': results['metadatas'][0][i].get('name', 'Unknown'),
                    'condition': results['metadatas'][0][i].get('condition', 'Unknown'),
                    'hospital': results['metadatas'][0][i].get('hospital', 'Unknown'),
                    'chunk_text': results['documents'][0][i],
                    'semantic_score': float(similarity),
                })
        
        return retrieved
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Perform hybrid retrieval: BM25 + semantic search with re-ranking.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of top-k results with combined scores
        """
        # Get results from both methods
        bm25_results = self._bm25_search(query, top_k=10)
        semantic_results = self._semantic_search(query, top_k=10)
        
        # Merge results by patient_id
        merged = {}
        
        # Add BM25 results
        for result in bm25_results:
            patient_id = result['patient_id']
            merged[patient_id] = result
            merged[patient_id]['bm25_score'] = result.get('bm25_score', 0)
            merged[patient_id]['semantic_score'] = 0
        
        # Add semantic results (merge or update)
        for result in semantic_results:
            patient_id = result['patient_id']
            if patient_id in merged:
                # Update with semantic score
                merged[patient_id]['semantic_score'] = result.get('semantic_score', 0)
            else:
                # New result from semantic search
                merged[patient_id] = result
                merged[patient_id]['bm25_score'] = 0
                merged[patient_id]['semantic_score'] = result.get('semantic_score', 0)
        
        # Normalize and combine scores
        for patient_id in merged:
            bm25 = merged[patient_id].get('bm25_score', 0)
            semantic = merged[patient_id].get('semantic_score', 0)
            
            # Normalize BM25 (0-1 range, rough estimate)
            # BM25 scores are typically in 0-20 range
            normalized_bm25 = min(bm25 / 10.0, 1.0)
            
            # Semantic is already 0-1
            normalized_semantic = semantic
            
            # Combined score: average of both
            combined_score = (normalized_bm25 + normalized_semantic) / 2.0
            merged[patient_id]['score'] = combined_score
        
        # Sort by combined score and return top-k
        sorted_results = sorted(
            merged.values(),
            key=lambda x: x['score'],
            reverse=True
        )
        
        return sorted_results[:top_k]


if __name__ == "__main__":
    # Test retriever
    retriever = HybridRetriever()
    
    query = "Which patients have diabetes?"
    results = retriever.retrieve(query, top_k=3)
    
    print(f"Query: {query}\n")
    print(f"Top {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result['name']} - {result['condition']}")
        print(f"   Score: {result['score']:.3f}")
        print(f"   Hospital: {result['hospital']}")
