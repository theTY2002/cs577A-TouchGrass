# test_posts.py
from datetime import datetime
from posts_service import create_post

def test_create_post():
    print("🧪 Testing create_post()...")
    
    # Create test data
    test_post = create_post(
        author_id="test_user_123",
        tags=["coffee", "meeting", "work"],
        date=datetime(2026, 2, 14, 14, 30),  # Feb 14, 2:30 PM
        location="Starbucks Downtown LA",
        plan_desc="Team sync over coffee",
        participants=["alice@company.com", "bob@company.com", "charlie@company.com"],
        chat_id="team_chat_456"
    )
    
    # Verify it worked
    print("✅ SUCCESS!")
    print(f"   Post ID: {test_post.id}")
    print(f"   Author: {test_post.author_id}")
    print(f"   Location: {test_post.location}")
    print(f"   Tags: {test_post.tags}")
    print(f"   Plan: {test_post.plan_desc}")
    print(f"   Participants: {test_post.participants}")
    print(f"   Chat ID: {test_post.chat_id}")
    
    return test_post

if __name__ == "__main__":
    test_create_post()