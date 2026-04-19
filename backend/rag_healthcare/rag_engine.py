"""
RAG Engine module: Core RAG logic to build LLM-ready prompts from retrieved context.
No LLM API calls here — just prepare the prompt for later integration.
"""

import os
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', '.env'))

try:
    from .retriever import HybridRetriever
except ImportError:
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

    def _build_structured_answer(self, query: str, retrieved_results: List[Dict], prompt: str) -> str:
        """Call Groq API to generate an answer based on the prompt."""
        if not retrieved_results:
            return "I could not find any relevant patient records to answer that question."

        try:
            client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant specialized in healthcare data analysis. Answer based ONLY on the provided patient records context."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile", # or another groq model like "llama3-8b-8192"
                temperature=0.3,
                max_tokens=1024,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            return f"Error communicating with LLM API: {str(e)}"
    
    def answer(self, query: str, top_k: int = 5) -> Dict:
        """
        Generate a RAG answer: retrieve context, build prompt, and call Groq API.
        
        Args:
            query: User's question/query
            top_k: Number of top results to retrieve
            
        Returns:
            Dictionary containing:
            - query: The original query
            - answer: The LLM generated answer
            - retrieved_patients: List of names and conditions
            - retrieved_count: Count of retrieved docs
            - prompt_ready: Boolean flag
            - prompt: Full LLM-ready prompt
            - note: Status message
        """
        # Retrieve relevant patient records
        retrieved_results = self.retriever.retrieve(query, top_k=top_k)
        
        # Build LLM-ready prompt
        prompt = self._build_prompt(query, retrieved_results)
        answer = self._build_structured_answer(query, retrieved_results, prompt)
        
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
            "answer": answer,
            "retrieved_patients": retrieved_patients,
            "retrieved_count": len(retrieved_results),
            "prompt_ready": True,
            "prompt": prompt,
            "note": "Answer generated successfully using Groq API.",
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
