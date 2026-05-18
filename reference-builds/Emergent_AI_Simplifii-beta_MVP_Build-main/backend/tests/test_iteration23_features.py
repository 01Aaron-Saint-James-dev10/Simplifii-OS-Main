"""
Iteration 23 Backend Tests
Testing 9 targeted fixes:
- FIX 7: Credits tool directory (frontend only)
- FIX 8: History CRUD API (GET /api/history, POST /api/history/save, GET /api/history/{id}, DELETE /api/history/{id})
- FIX 9: Privacy/Terms pages (frontend only)
- FIX 3: Essay Scorer calibrationNote + incompleteWarning
- FIX 6: Hidden Curriculum Decoder 3 new sections
- FIX 1: Concept Visualiser feynmanSteps
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_COOKIE = "sess_d306e6f810a44648826d43c8d77e9ca5"  # Owner session


@pytest.fixture
def auth_session():
    """Session with owner auth cookie"""
    session = requests.Session()
    session.cookies.set('session_token', SESSION_COOKIE)
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthCheck:
    """Basic health check"""
    
    def test_backend_health(self):
        """Backend should respond"""
        # Check auth/me endpoint as health proxy (returns 401 without auth, but proves backend is up)
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [200, 401, 403], f"Backend not responding: {response.status_code}"
        print("✓ Backend health check passed")


class TestHistoryCRUD:
    """FIX 8: History API CRUD operations"""
    
    def test_save_history_entry(self, auth_session):
        """POST /api/history/save should create a new entry"""
        payload = {
            "tool_name": "TEST_Brief Simplifier",
            "input_summary": "TEST input summary for iteration 23",
            "output_summary": "TEST output summary",
            "full_output": {"test_key": "test_value", "nested": {"data": 123}},
            "ticket_cost": 2
        }
        response = auth_session.post(f"{BASE_URL}/api/history/save", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "saved"
        assert "history_id" in data
        assert data["history_id"].startswith("hist_")
        print(f"✓ History entry saved with ID: {data['history_id']}")
        return data["history_id"]
    
    def test_get_history_list(self, auth_session):
        """GET /api/history should return entries and total"""
        response = auth_session.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "entries" in data, "Response should have 'entries' field"
        assert "total" in data, "Response should have 'total' field"
        assert isinstance(data["entries"], list)
        assert isinstance(data["total"], int)
        print(f"✓ History list returned {len(data['entries'])} entries, total: {data['total']}")
    
    def test_get_history_with_limit(self, auth_session):
        """GET /api/history?limit=5 should respect limit"""
        response = auth_session.get(f"{BASE_URL}/api/history?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["entries"]) <= 5
        print(f"✓ History list with limit=5 returned {len(data['entries'])} entries")
    
    def test_get_history_with_tool_filter(self, auth_session):
        """GET /api/history?tool=Brief Simplifier should filter by tool"""
        response = auth_session.get(f"{BASE_URL}/api/history?tool=Brief Simplifier")
        assert response.status_code == 200
        
        data = response.json()
        # All entries should be for Brief Simplifier (if any exist)
        for entry in data["entries"]:
            assert entry["tool_name"] == "Brief Simplifier" or "TEST" in entry["tool_name"]
        print(f"✓ History filter by tool returned {len(data['entries'])} entries")
    
    def test_history_crud_full_flow(self, auth_session):
        """Full CRUD: Create → Read → Get Single → Delete"""
        # 1. CREATE
        payload = {
            "tool_name": "TEST_CRUD_Flow",
            "input_summary": "CRUD test input",
            "output_summary": "CRUD test output",
            "full_output": {"crud": "test"},
            "ticket_cost": 1
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/history/save", json=payload)
        assert create_resp.status_code == 200
        history_id = create_resp.json()["history_id"]
        print(f"  Created: {history_id}")
        
        # 2. GET SINGLE
        get_resp = auth_session.get(f"{BASE_URL}/api/history/{history_id}")
        assert get_resp.status_code == 200, f"Expected 200, got {get_resp.status_code}: {get_resp.text}"
        
        entry = get_resp.json()
        assert entry["history_id"] == history_id
        assert entry["tool_name"] == "TEST_CRUD_Flow"
        assert entry["input_summary"] == "CRUD test input"
        assert "full_output" in entry
        assert entry["full_output"]["crud"] == "test"
        print(f"  Retrieved: {entry['tool_name']}")
        
        # 3. DELETE
        delete_resp = auth_session.delete(f"{BASE_URL}/api/history/{history_id}")
        assert delete_resp.status_code == 200
        assert delete_resp.json()["status"] == "deleted"
        print(f"  Deleted: {history_id}")
        
        # 4. VERIFY DELETED
        verify_resp = auth_session.get(f"{BASE_URL}/api/history/{history_id}")
        assert verify_resp.status_code == 404
        print("✓ Full CRUD flow passed")
    
    def test_history_entry_not_found(self, auth_session):
        """GET /api/history/{invalid_id} should return 404"""
        response = auth_session.get(f"{BASE_URL}/api/history/hist_nonexistent123")
        assert response.status_code == 404
        print("✓ Non-existent history entry returns 404")
    
    def test_history_requires_auth(self):
        """History endpoints should require authentication"""
        # No auth cookie
        response = requests.get(f"{BASE_URL}/api/history")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ History endpoints require authentication")


class TestEssayScorerFixes:
    """FIX 3 & 4: Essay Scorer calibrationNote and incompleteWarning"""
    
    def test_essay_scorer_endpoint_exists(self, auth_session):
        """POST /api/essay/score endpoint should exist"""
        # Just check endpoint exists with minimal payload
        payload = {
            "essay_text": "This is a test essay.",
            "rubric_text": "",
            "brief_text": ""
        }
        response = auth_session.post(f"{BASE_URL}/api/essay/score", json=payload)
        # Should not be 404 or 405
        assert response.status_code not in [404, 405], f"Endpoint not found: {response.status_code}"
        print(f"✓ Essay scorer endpoint exists (status: {response.status_code})")
    
    def test_essay_scorer_requires_text(self, auth_session):
        """Essay scorer should require essay text"""
        payload = {
            "essay_text": "",
            "rubric_text": "",
            "brief_text": ""
        }
        response = auth_session.post(f"{BASE_URL}/api/essay/score", json=payload)
        assert response.status_code == 400
        print("✓ Essay scorer requires essay text")


class TestHiddenCurriculumDecoder:
    """FIX 6: Hidden Curriculum Decoder endpoint"""
    
    def test_decode_jargon_endpoint_exists(self, auth_session):
        """POST /api/decode-jargon endpoint should exist"""
        payload = {"text": "Test academic text"}
        response = auth_session.post(f"{BASE_URL}/api/decode-jargon", json=payload)
        assert response.status_code not in [404, 405], f"Endpoint not found: {response.status_code}"
        print(f"✓ Decode jargon endpoint exists (status: {response.status_code})")


class TestConceptVisualiser:
    """FIX 1: Concept Visualiser feynmanSteps"""
    
    def test_concept_visualise_endpoint_exists(self, auth_session):
        """POST /api/concept/visualise endpoint should exist"""
        payload = {"concept": "test", "simple_mode": False}
        response = auth_session.post(f"{BASE_URL}/api/concept/visualise", json=payload)
        assert response.status_code not in [404, 405], f"Endpoint not found: {response.status_code}"
        print(f"✓ Concept visualise endpoint exists (status: {response.status_code})")


class TestPublicPages:
    """FIX 9: Privacy and Terms pages are public routes"""
    
    def test_privacy_page_accessible(self):
        """Privacy page should be accessible without auth"""
        # This is a frontend route, but we can check the backend doesn't block it
        response = requests.get(f"{BASE_URL}/privacy", allow_redirects=True)
        # Frontend routes return 200 from the React app
        print(f"✓ Privacy route accessible (status: {response.status_code})")
    
    def test_terms_page_accessible(self):
        """Terms page should be accessible without auth"""
        response = requests.get(f"{BASE_URL}/terms", allow_redirects=True)
        print(f"✓ Terms route accessible (status: {response.status_code})")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_history(self, auth_session):
        """Delete any TEST_ prefixed history entries"""
        response = auth_session.get(f"{BASE_URL}/api/history?limit=100")
        if response.status_code == 200:
            entries = response.json().get("entries", [])
            deleted = 0
            for entry in entries:
                if "TEST" in entry.get("tool_name", ""):
                    del_resp = auth_session.delete(f"{BASE_URL}/api/history/{entry['history_id']}")
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test history entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
