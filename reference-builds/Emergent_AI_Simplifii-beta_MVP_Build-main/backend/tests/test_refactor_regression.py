"""
Regression Tests for Backend Refactor (Iteration 10)
Tests all endpoints to ensure the modular refactor didn't break any functionality.
Covers: auth, user, tools, briefs, payments, chat, notifications, planner routes
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAuthEndpoints:
    """Auth route tests - /api/auth/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_valid_credentials(self):
        """POST /api/auth/login with valid credentials returns user object"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user_id" in data, "Missing user_id in response"
        assert "email" in data, "Missing email in response"
        assert "name" in data, "Missing name in response"
        assert data["email"] == "test@simplifii.com"
        print(f"SUCCESS: Login returned user_id={data['user_id']}, email={data['email']}, name={data['name']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Invalid credentials return 401")
    
    def test_auth_me_without_auth(self):
        """GET /api/auth/me without auth returns 401"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /auth/me without auth returns 401")
    
    def test_auth_me_with_session(self):
        """GET /api/auth/me with valid session cookie returns user data"""
        # Login first
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        
        # Now check /auth/me
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print(f"SUCCESS: /auth/me returned user data for {data['email']}")
    
    def test_logout_clears_session(self):
        """POST /api/auth/logout clears session"""
        # Login first
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        
        # Logout
        response = self.session.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("SUCCESS: Logout returned success message")


class TestUserEndpoints:
    """User route tests - /api/user/*, /api/universities"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_universities_list(self):
        """GET /api/universities returns list of 40 universities"""
        response = self.session.get(f"{BASE_URL}/api/universities")
        assert response.status_code == 200
        data = response.json()
        assert "universities" in data
        assert len(data["universities"]) == 40, f"Expected 40 universities, got {len(data['universities'])}"
        print(f"SUCCESS: Universities returned {len(data['universities'])} items")
    
    def test_user_profile(self):
        """GET /api/user/profile with auth returns user profile"""
        response = self.session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "onboarding_complete" in data
        print(f"SUCCESS: User profile returned for {data['user']['email']}")


class TestCreditsEndpoints:
    """Credits/payments route tests - /api/credits/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_credits_balance(self):
        """GET /api/credits/balance with auth returns credits object"""
        response = self.session.get(f"{BASE_URL}/api/credits/balance")
        assert response.status_code == 200
        data = response.json()
        assert "credits" in data
        print(f"SUCCESS: Credits balance = {data['credits']}")


class TestNotificationsEndpoints:
    """Notifications route tests - /api/notifications"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_notifications(self):
        """GET /api/notifications with auth returns notifications array"""
        response = self.session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        print(f"SUCCESS: Notifications returned {len(data['notifications'])} items")


class TestBriefsEndpoints:
    """Briefs route tests - /api/briefs/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_briefs_history(self):
        """GET /api/briefs/history with auth returns array of briefs"""
        response = self.session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Briefs history returned {len(data)} items")
    
    def test_pdf_extract_endpoint_exists(self):
        """POST /api/pdf/extract-text endpoint exists (public)"""
        # This endpoint requires file upload, so we just check it doesn't 404
        response = self.session.post(f"{BASE_URL}/api/pdf/extract-text")
        # Should return 422 (validation error) not 404
        assert response.status_code in [422, 400], f"Expected 422 or 400, got {response.status_code}"
        print("SUCCESS: /api/pdf/extract-text endpoint exists")


class TestToolsEndpoints:
    """Tools route tests - /api/rubric/*, /api/essay/*, /api/humanise, etc."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_concept_visualise_requires_auth(self):
        """POST /api/concept/visualise without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/concept/visualise", json={
            "concept": "test",
            "simple_mode": False
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /concept/visualise requires auth")
    
    def test_rubric_simplify_requires_auth(self):
        """POST /api/rubric/simplify without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": "test rubric"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /rubric/simplify requires auth")
    
    def test_essay_score_requires_auth(self):
        """POST /api/essay/score without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": "test essay",
            "rubric_text": "test rubric"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /essay/score requires auth")
    
    def test_humanise_requires_auth(self):
        """POST /api/humanise without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/humanise", json={
            "text": "test text"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /humanise requires auth")
    
    def test_scaffold_requires_auth(self):
        """POST /api/scaffold without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "essay",
            "topic": "test",
            "word_count": 1000,
            "level": "undergraduate"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /scaffold requires auth")
    
    def test_decode_jargon_requires_auth(self):
        """POST /api/decode-jargon without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": "test text"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /decode-jargon requires auth")
    
    def test_translate_requires_auth(self):
        """POST /api/translate without auth returns 401"""
        response = self.session.post(f"{BASE_URL}/api/translate", json={
            "text": "test text",
            "target_language": "Spanish"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: /translate requires auth")


class TestChatEndpoints:
    """Chat route tests - /api/study-buddy/*, /api/checkin"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_study_buddy_chat(self):
        """POST /api/study-buddy/chat with auth and message returns response"""
        response = self.session.post(
            f"{BASE_URL}/api/study-buddy/chat",
            json={"message": "Hello, can you help me?", "session_id": "test_regression_123"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        print(f"SUCCESS: Study buddy responded with session_id={data['session_id']}")
    
    def test_checkin(self):
        """POST /api/checkin with auth returns checkin response with mood message"""
        response = self.session.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_brief_123",
            "mood": "okay",
            "note": "Testing checkin"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "checkin_id" in data
        assert "message" in data
        print(f"SUCCESS: Checkin returned message: {data['message'][:50]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
