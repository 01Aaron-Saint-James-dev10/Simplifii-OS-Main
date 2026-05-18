"""
Iteration 27 Tests - ToolExplainerModal, RecentToolOutputs, Notification Dedup, SavedOutputs, Course Planner fixes
Tests:
1. GET /api/notifications - returns deduplicated notifications
2. GET /api/history/recent/{tool_name} - returns recent entries for a tool
3. GET /api/history - returns all history entries
4. POST /api/auth/login - login with test credentials
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndSession:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a session with auth cookie"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        """Login and return authenticated session"""
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            return session
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_login_success(self, session):
        """Test login with valid credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data or "email" in data, "Response should contain user data"
        print(f"Login successful: {data.get('email', data.get('user', {}).get('email', 'unknown'))}")


class TestNotifications:
    """Notification deduplication tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_resp = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            return s
        pytest.skip("Authentication failed")
    
    def test_get_notifications_returns_list(self, auth_session):
        """Test GET /api/notifications returns notifications array"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "notifications" in data, "Response should have 'notifications' key"
        assert isinstance(data["notifications"], list), "notifications should be a list"
        print(f"Notifications count: {len(data['notifications'])}")
        
        # Check notification structure if any exist
        if len(data["notifications"]) > 0:
            notif = data["notifications"][0]
            assert "type" in notif, "Notification should have 'type'"
            assert "title" in notif, "Notification should have 'title'"
            print(f"First notification type: {notif['type']}, title: {notif['title'][:50]}...")
    
    def test_notifications_are_deduplicated(self, auth_session):
        """Test that notifications don't have duplicate titles (after normalization)"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        notifications = data.get("notifications", [])
        
        # Normalize titles for comparison (strip non-alphanumeric, lowercase)
        def normalize(title):
            return ''.join(c for c in title.lower() if c.isalnum() or c == ' ').strip()
        
        seen_titles = set()
        duplicates = []
        for notif in notifications:
            title = notif.get("title", "")
            normalized = normalize(title)
            if normalized in seen_titles:
                duplicates.append(title)
            seen_titles.add(normalized)
        
        assert len(duplicates) == 0, f"Found duplicate notifications: {duplicates}"
        print(f"No duplicates found in {len(notifications)} notifications")


class TestHistoryEndpoints:
    """History/Recent outputs tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_resp = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            return s
        pytest.skip("Authentication failed")
    
    def test_get_history_returns_entries(self, auth_session):
        """Test GET /api/history returns history entries"""
        response = auth_session.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        assert isinstance(data["entries"], list), "entries should be a list"
        print(f"History entries count: {len(data['entries'])}")
        
        # Check entry structure if any exist
        if len(data["entries"]) > 0:
            entry = data["entries"][0]
            assert "history_id" in entry, "Entry should have 'history_id'"
            assert "tool_name" in entry, "Entry should have 'tool_name'"
            print(f"First entry tool: {entry['tool_name']}")
    
    def test_get_recent_by_tool_brief_simplifier(self, auth_session):
        """Test GET /api/history/recent/Brief Simplifier"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Brief%20Simplifier?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        assert isinstance(data["entries"], list), "entries should be a list"
        assert len(data["entries"]) <= 3, "Should return at most 3 entries"
        print(f"Recent Brief Simplifier entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_rubric_simplifier(self, auth_session):
        """Test GET /api/history/recent/Rubric Simplifier"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Rubric%20Simplifier?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Rubric Simplifier entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_essay_scorer(self, auth_session):
        """Test GET /api/history/recent/Essay Scorer"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Essay%20Scorer?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Essay Scorer entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_humaniser(self, auth_session):
        """Test GET /api/history/recent/Humaniser"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Humaniser?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Humaniser entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_scaffolder(self, auth_session):
        """Test GET /api/history/recent/Assessment Scaffolder"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Assessment%20Scaffolder?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Assessment Scaffolder entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_course_planner(self, auth_session):
        """Test GET /api/history/recent/Course Planner"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Course%20Planner?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Course Planner entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_decoder(self, auth_session):
        """Test GET /api/history/recent/Hidden Curriculum Decoder"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Hidden%20Curriculum%20Decoder?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Hidden Curriculum Decoder entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_concept_visualiser(self, auth_session):
        """Test GET /api/history/recent/Concept Visualiser"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Concept%20Visualiser?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Concept Visualiser entries: {len(data['entries'])}")
    
    def test_get_recent_by_tool_exec_planner(self, auth_session):
        """Test GET /api/history/recent/Executive Function Planner"""
        response = auth_session.get(f"{BASE_URL}/api/history/recent/Executive%20Function%20Planner?limit=3")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "entries" in data, "Response should have 'entries' key"
        print(f"Recent Executive Function Planner entries: {len(data['entries'])}")


class TestSavedOutputsAPI:
    """Saved outputs API tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_resp = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            return s
        pytest.skip("Authentication failed")
    
    def test_save_and_retrieve_output(self, auth_session):
        """Test POST /api/history/save and GET /api/history/{id}"""
        # Save a test output
        save_payload = {
            "tool_name": "TEST_Tool",
            "input_summary": "TEST_input_summary",
            "output_summary": "TEST_output_summary",
            "full_output": {"test": "data", "nested": {"key": "value"}},
            "ticket_cost": 1
        }
        save_resp = auth_session.post(f"{BASE_URL}/api/history/save", json=save_payload)
        assert save_resp.status_code == 200, f"Save failed: {save_resp.text}"
        save_data = save_resp.json()
        assert "history_id" in save_data, "Response should have history_id"
        history_id = save_data["history_id"]
        print(f"Saved output with ID: {history_id}")
        
        # Retrieve the saved output
        get_resp = auth_session.get(f"{BASE_URL}/api/history/{history_id}")
        assert get_resp.status_code == 200, f"Get failed: {get_resp.text}"
        get_data = get_resp.json()
        assert get_data["tool_name"] == "TEST_Tool", "Tool name should match"
        assert get_data["full_output"]["test"] == "data", "Full output should be preserved"
        print(f"Retrieved output: {get_data['tool_name']}")
        
        # Clean up - delete the test entry
        del_resp = auth_session.delete(f"{BASE_URL}/api/history/{history_id}")
        assert del_resp.status_code == 200, f"Delete failed: {del_resp.text}"
        print(f"Deleted test entry: {history_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
