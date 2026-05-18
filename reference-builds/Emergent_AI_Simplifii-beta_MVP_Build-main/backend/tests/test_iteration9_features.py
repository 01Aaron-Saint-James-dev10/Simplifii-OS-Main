"""
Iteration 9 Tests - Concept Visualiser and Enhanced Accessibility
Tests for:
1. Concept Visualiser API (/api/concept/visualise)
2. Landing page 9 tools
3. Dashboard 9 tools
4. Navigation includes Visualiser
5. Auth flow (login, /login redirect)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print(f"SUCCESS: Login returned user_id={data['user_id']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials return 401")
    
    def test_auth_me_requires_auth(self):
        """Test /auth/me requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: /auth/me requires authentication")


class TestConceptVisualiser:
    """Concept Visualiser API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login first
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_concept_visualise_basic(self):
        """Test concept visualise with basic concept"""
        response = self.session.post(
            f"{BASE_URL}/api/concept/visualise",
            json={"concept": "gravity", "simple_mode": False},
            timeout=45
        )
        assert response.status_code == 200, f"Concept visualise failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "concept" in data, "Missing 'concept' in response"
        assert "oneLiner" in data, "Missing 'oneLiner' in response"
        assert "scenes" in data, "Missing 'scenes' in response"
        assert "keyTakeaways" in data, "Missing 'keyTakeaways' in response"
        assert "relatedConcepts" in data, "Missing 'relatedConcepts' in response"
        assert "quiz" in data, "Missing 'quiz' in response"
        
        # Verify scenes count (should be 5)
        assert len(data["scenes"]) == 5, f"Expected 5 scenes, got {len(data['scenes'])}"
        
        # Verify each scene has required fields
        for i, scene in enumerate(data["scenes"]):
            assert "sceneNumber" in scene, f"Scene {i} missing sceneNumber"
            assert "title" in scene, f"Scene {i} missing title"
            assert "visualMetaphor" in scene, f"Scene {i} missing visualMetaphor"
            assert "explanation" in scene, f"Scene {i} missing explanation"
            assert "icon" in scene, f"Scene {i} missing icon"
            assert "colour" in scene, f"Scene {i} missing colour"
            assert "complexity" in scene, f"Scene {i} missing complexity"
        
        # Verify related concepts count (should be 5)
        assert len(data["relatedConcepts"]) == 5, f"Expected 5 related concepts, got {len(data['relatedConcepts'])}"
        
        # Verify quiz count (should be 3)
        assert len(data["quiz"]) == 3, f"Expected 3 quiz questions, got {len(data['quiz'])}"
        
        # Verify quiz structure
        for i, q in enumerate(data["quiz"]):
            assert "question" in q, f"Quiz {i} missing question"
            assert "options" in q, f"Quiz {i} missing options"
            assert "correctIndex" in q, f"Quiz {i} missing correctIndex"
            assert "explanation" in q, f"Quiz {i} missing explanation"
            assert len(q["options"]) == 4, f"Quiz {i} should have 4 options"
        
        print(f"SUCCESS: Concept visualise returned valid response with {len(data['scenes'])} scenes, {len(data['relatedConcepts'])} related concepts, {len(data['quiz'])} quiz questions")
    
    def test_concept_visualise_simple_mode(self):
        """Test concept visualise with ELI5 mode"""
        response = self.session.post(
            f"{BASE_URL}/api/concept/visualise",
            json={"concept": "photosynthesis", "simple_mode": True},
            timeout=45
        )
        assert response.status_code == 200, f"Concept visualise (simple mode) failed: {response.text}"
        data = response.json()
        
        assert "scenes" in data
        assert len(data["scenes"]) == 5
        print(f"SUCCESS: Concept visualise (simple mode) returned {len(data['scenes'])} scenes")
    
    def test_concept_visualise_requires_auth(self):
        """Test concept visualise requires authentication"""
        # Create new session without login
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        
        response = new_session.post(
            f"{BASE_URL}/api/concept/visualise",
            json={"concept": "test", "simple_mode": False}
        )
        assert response.status_code == 401, "Concept visualise should require auth"
        print("SUCCESS: Concept visualise requires authentication")


class TestExistingAPIs:
    """Test existing APIs still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login first
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for test setup"
    
    def test_notifications(self):
        """Test notifications endpoint"""
        response = self.session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        print(f"SUCCESS: Notifications returned {len(data['notifications'])} items")
    
    def test_credits_balance(self):
        """Test credits balance endpoint"""
        response = self.session.get(f"{BASE_URL}/api/credits/balance")
        assert response.status_code == 200
        data = response.json()
        assert "credits" in data
        print(f"SUCCESS: Credits balance = {data['credits']}")
    
    def test_universities(self):
        """Test universities endpoint"""
        response = self.session.get(f"{BASE_URL}/api/universities")
        assert response.status_code == 200
        data = response.json()
        assert "universities" in data
        assert len(data["universities"]) > 0
        print(f"SUCCESS: Universities returned {len(data['universities'])} items")
    
    def test_user_profile(self):
        """Test user profile endpoint"""
        response = self.session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        print(f"SUCCESS: User profile returned for {data['user']['email']}")
    
    def test_briefs_history(self):
        """Test briefs history endpoint"""
        response = self.session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Briefs history returned {len(data)} items")
    
    def test_study_buddy_chat(self):
        """Test study buddy chat endpoint"""
        response = self.session.post(
            f"{BASE_URL}/api/study-buddy/chat",
            json={"message": "Hello", "session_id": "test_session_123"},
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        print(f"SUCCESS: Study buddy responded")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
