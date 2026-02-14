# posts_service.py
from typing import List, Optional
from datetime import datetime
from http_client import HttpClient  # Your class
from post import Post

# Create client instance once (global)
_client = HttpClient(base_url="https://jsonplaceholder.typicode.com")

def create_post(
    author_id: str,
    tags: List[str],
    date: datetime,
    location: str,
    plan_desc: str,
    participants: List[str],
    chat_id: str
) -> Post:
    payload = {
        "author_id": author_id,
        "tags": tags,
        "date": date.isoformat(),
        "location": location,
        "plan_desc": plan_desc,
        "participants": participants,
        "chat_id": chat_id,
    }
    
    # Use instance method
    data = _client.post("/posts", json=payload)
    
    return Post(**data)
