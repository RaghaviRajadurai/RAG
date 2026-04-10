"""
RAG Engine module: Core RAG logic to build LLM-ready prompts from retrieved context.
No LLM API calls here — just prepare the prompt for later integration.
"""

from typing import List, Dict
from retriever import HybridRetriever


class RAGEngine:
    """
    RAG Engine: Retrieves context and builds LLM-ready prompts.
    """
    
    def __init__(self, persist_dir: str = "./chroma_db"):
        """
        Initialize RAG engine with a retriever.
        
        Args:
            persist_dir: Directory path for ChromaDB persistence
        """
        self.retriever = HybridRetriever(persist_dir=persist_dir)
    
    def _build_prompt(self, query: str, retrieved_results: List[Dict]) -> str:
        """
        Build a complete LLM-ready prompt from retrieved context.
        
        Args:
            query: User's search query
            retrieved_results: List of retrieved patient records
            
        Returns:
            Formatted prompt string ready for LLM
        """
        # Format context chunks
        context_items = []
        for i, result in enumerate(retrieved_results, 1):
            chunk = result['chunk_text']
            context_items.append(f"{i}. {chunk}")
        
        context_text = "\n\n".join(context_items)
        
        # Build full prompt
        prompt = f"""--- SYSTEM ---
You are a medical AI assistant specialized in healthcare data analysis. 
Your role is to answer questions ONLY based on the provided patient records context. 
Do not hallucinate or infer information not present in the records. 
Be accurate, concise, and professional in your responses.
If the answer is not found in the provided context, clearly state: 
"Information not available in current patient records."

--- CONTEXT (Retrieved Patient Records) ---
{context_text}

--- QUESTION ---
{query}

--- INSTRUCTION ---
Based ONLY on the context provided above, answer the user's question. 
Be specific and cite patient names/IDs when relevant. 
Keep the response clear and medically appropriate."""
        
        return prompt
    
    def answer(self, query: str, top_k: int = 5) -> Dict:
        """
        Generate a RAG answer: retrieve context and build prompt.
        
        Args:
            query: User's question/query
            top_k: Number of top results to retrieve
            
        Returns:
            Dictionary containing:
            - query: The original query
            - retrieved_patients: List of names and conditions
            - prompt_ready: Boolean flag
            - prompt: Full LLM-ready prompt
            - note: Status message
        """
        # Retrieve relevant patient records
        retrieved_results = self.retriever.retrieve(query, top_k=top_k)
        
        # Build LLM-ready prompt
        prompt = self._build_prompt(query, retrieved_results)
        
        # Extract retrieved patient info
        retrieved_patients = [
            {
                'name': r['name'],
                'condition': r['condition'],
                'hospital': r['hospital'],
                'score': r['score']
            }
            for r in retrieved_results
        ]
        
        # Return result dictionary
        result = {
            "query": query,
            "retrieved_patients": retrieved_patients,
            "retrieved_count": len(retrieved_results),
            "prompt_ready": True,
            "prompt": prompt,
            "note": "RAG context ready. LLM API not connected yet. Plug in API key to get AI-generated answer.",
        }
        
        return result


if __name__ == "__main__":
    # Test RAG engine
    engine = RAGEngine()
    
    query = "Which patients have high blood pressure?"
    result = engine.answer(query, top_k=3)
    
    print("QUERY:", result['query'])
    print("\nRETRIEVED PATIENTS:")
    for patient in result['retrieved_patients']:
        print(f"  - {patient['name']}: {patient['condition']} (score: {patient['score']:.3f})")
    
    print("\nPROMPT READY:", result['prompt_ready'])
    print("\nFULL PROMPT:")
    print("-" * 80)
    print(result['prompt'])
    print("-" * 80)
