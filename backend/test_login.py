import requests

def test_login_and_query():
    base_url = "http://localhost:8001"
    login_data = {
        "username": "ananya.sharma.01@patient.health.in",
        "password": "Patient@101"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        token = response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        rag_resp = requests.post(f"{base_url}/api/rag/query", json={"query": "test"}, headers=headers)
        print(f"RAG Query Status: {rag_resp.status_code}")
        print(f"RAG Query Body: {rag_resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_login_and_query()