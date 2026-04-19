import requests
import time

def test_rag():
    base_url = "http://localhost:8001"
    
    print("1. Logging in as Doctor...")
    login_data = {
        "username": "arjun.mehta@hospital.in",
        "password": "Doctor@201"
    }
    
    # We use the /auth/login endpoint
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"Login failed! Status: {response.status_code}, Body: {response.text}")
        return
        
    token = response.json().get("access_token")
    print("Login successful! Got JWT token.")
    
    print("\n2. Testing RAG Query with Groq...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    query_payload = {
        "query": "Which patients have high blood pressure?",
        "top_k": 3
    }
    
    start_time = time.time()
    rag_resp = requests.post(f"{base_url}/api/rag/query", json=query_payload, headers=headers)
    end_time = time.time()
    
    if rag_resp.status_code != 200:
        print(f"RAG query failed! Status: {rag_resp.status_code}, Body: {rag_resp.text}")
        return
        
    result = rag_resp.json()
    print(f"RAG query successful! Took {end_time - start_time:.2f} seconds.")
    print("\n--- GROQ RESPONSE ---")
    print(result.get("result", {}).get("answer"))
    print("\n--- RETRIEVED PATIENTS ---")
    for p in result.get("result", {}).get("retrieved_patients", []):
        print(f"Name: {p.get('name')}, Condition: {p.get('condition')}")
        
if __name__ == '__main__':
    test_rag()
