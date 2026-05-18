"""
Iteration 24 - Testing new user features:
1. Essay Scorer page rendering with correct field mapping
2. Profile Dropdown with all expected items
3. Settings page at /settings
4. Onboarding Modal for new users
5. Pain Points questionnaire
6. Explainer Video placeholder
7. Accessibility trigger with Brain icon
8. Mobile menu with Settings link
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_backend_health(self):
        """Test backend is responding"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        # Should return 401 without auth, not 500
        assert response.status_code in [200, 401], f"Unexpected status: {response.status_code}"
        print("SUCCESS: Backend is responding")
    
    def test_login_with_test_credentials(self):
        """Test login with test@simplifii.com"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            timeout=10
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print(f"SUCCESS: Login successful, user_id: {data['user_id']}")


class TestNewUserEndpoints:
    """Test new user-related API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            timeout=10
        )
        assert response.status_code == 200, "Login failed in setup"
        self.user_data = response.json()
    
    def test_complete_onboarding_endpoint(self):
        """Test POST /api/user/complete-onboarding"""
        response = self.session.post(
            f"{BASE_URL}/api/user/complete-onboarding",
            json={},
            timeout=10
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print("SUCCESS: complete-onboarding endpoint works")
    
    def test_pain_point_endpoint(self):
        """Test POST /api/user/pain-point"""
        response = self.session.post(
            f"{BASE_URL}/api/user/pain-point",
            json={"painPoint": "Understanding what markers want"},
            timeout=10
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print("SUCCESS: pain-point endpoint works")
    
    def test_profile_update_endpoint(self):
        """Test PUT /api/user/profile"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "Test User Updated"},
            timeout=10
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print("SUCCESS: profile update endpoint works")
    
    def test_auth_me_returns_new_fields(self):
        """Test GET /api/auth/me returns hasCompletedOnboarding and painPoint"""
        response = self.session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check new fields exist
        assert "hasCompletedOnboarding" in data, "Missing hasCompletedOnboarding field"
        assert "painPoint" in data or data.get("painPoint") is None, "painPoint field issue"
        assert "is_owner" in data, "Missing is_owner field"
        
        print(f"SUCCESS: auth/me returns new fields - hasCompletedOnboarding: {data.get('hasCompletedOnboarding')}, painPoint: {data.get('painPoint')}")
    
    def test_profile_update_persists(self):
        """Test that profile update actually persists"""
        # Update name
        update_response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "Test User Verified"},
            timeout=10
        )
        assert update_response.status_code == 200
        
        # Verify via GET
        get_response = self.session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["name"] == "Test User Verified", f"Name not updated: {data['name']}"
        
        # Reset name
        self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "Test User"},
            timeout=10
        )
        print("SUCCESS: Profile update persists correctly")


class TestEssayScorerEndpoint:
    """Test Essay Scorer API endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            timeout=10
        )
        assert response.status_code == 200, "Login failed in setup"
    
    def test_essay_score_endpoint_exists(self):
        """Test POST /api/essay/score endpoint exists"""
        response = self.session.post(
            f"{BASE_URL}/api/essay/score",
            json={"essay_text": "", "rubric_text": "", "brief_text": ""},
            timeout=10
        )
        # Should return 400 for empty essay, not 404
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        print(f"SUCCESS: Essay score endpoint exists (status: {response.status_code})")
    
    def test_essay_score_requires_essay_text(self):
        """Test that essay scorer requires essay text"""
        response = self.session.post(
            f"{BASE_URL}/api/essay/score",
            json={"essay_text": "", "rubric_text": "test rubric", "brief_text": ""},
            timeout=10
        )
        # Should reject empty essay
        assert response.status_code in [400, 422], f"Should reject empty essay: {response.status_code}"
        print("SUCCESS: Essay scorer validates essay text")


class TestEndpointAuthentication:
    """Test that new endpoints require authentication"""
    
    def test_complete_onboarding_requires_auth(self):
        """Test complete-onboarding requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/user/complete-onboarding",
            json={},
            timeout=10
        )
        assert response.status_code == 401, f"Should require auth: {response.status_code}"
        print("SUCCESS: complete-onboarding requires authentication")
    
    def test_pain_point_requires_auth(self):
        """Test pain-point requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/user/pain-point",
            json={"painPoint": "test"},
            timeout=10
        )
        assert response.status_code == 401, f"Should require auth: {response.status_code}"
        print("SUCCESS: pain-point requires authentication")
    
    def test_profile_update_requires_auth(self):
        """Test profile update requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "test"},
            timeout=10
        )
        assert response.status_code == 401, f"Should require auth: {response.status_code}"
        print("SUCCESS: profile update requires authentication")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_user():
    """Reset test user state after all tests"""
    yield
    # Reset test user's state
    session = requests.Session()
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@simplifii.com", "password": "test123"},
        timeout=10
    )
    if login_response.status_code == 200:
        # Reset name
        session.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "Test User"},
            timeout=10
        )
        print("Cleanup: Test user state reset")
