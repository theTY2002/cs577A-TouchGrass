from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

# TODO: Add location data (probably as its own type)
@dataclass
class Post:
    id: Optional[str]
    author_id: str
    tags: List[str]
    date: datetime
    location: str
    plan_desc: str
    participants: List[str]
    chat_id: str
    created_at: Optional[datetime] = None