import requests
from typing import Any, Dict, Optional

class HttpClient:
    def __init__(self, base_url: str, api_key: Optional[str] = None, timeout: int = 5):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    def post(self, path: str, json: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/{path.lstrip('/')}"
        resp = requests.post(url, json=json, headers=self._headers(), timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()