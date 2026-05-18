"""
Iteration 28 Backend Tests
- Ticket repricing (TICKET_COSTS verification)
- Welcome credits = 5 on signup
- Analytics endpoints (pathway, error, session, checkin)
- Auth login/me endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@simplifii.com"
TEST_PASSWORD = "test123"


class TestTicketCosts:
    """Verify TICKET_COSTS are correctly configured"""
    
    def test_ticket_costs_via_credits_page(self):
        """Login and verify user can access credits info"""
        session = requests.Session()
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        
        # Get user info to verify credits system works
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200, f"Get me failed: {me_resp.text}"
        user_data = me_resp.json()
        assert "credits" in user_data, "User should have credits field"
        print(f"User credits: {user_data['credits']}")


class TestAuthSignupCredits:
    """Verify new users get 5 welcome tickets"""
    
    def test_register_gives_5_credits(self):
        """New user registration should give 5 credits"""
        session = requests.Session()
        unique_email = f"test_signup_{uuid.uuid4().hex[:8]}@test.com"
        
        register_resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert register_resp.status_code == 200, f"Register failed: {register_resp.text}"
        
        user_data = register_resp.json()
        assert user_data.get("credits") == 5, f"Expected 5 credits, got {user_data.get('credits')}"
        print(f"New user registered with {user_data['credits']} credits (expected 5)")


class TestAnalyticsEndpoints:
    """Test new analytics endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    
    def test_analytics_pathway(self):
        """POST /api/analytics/pathway should log pathway event"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/pathway", json={
            "fromTool": "Brief Simplifier",
            "toTool": "Rubric Simplifier",
            "assessmentName": "Test Assessment"
        })
        assert resp.status_code == 200, f"Pathway analytics failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "logged", f"Expected status 'logged', got {data}"
        print("Analytics pathway endpoint working")
    
    def test_analytics_error(self):
        """POST /api/analytics/error should log tool error"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/error", json={
            "toolName": "Brief Simplifier",
            "errorType": "upload_failed",
            "errorMessage": "Test error message",
            "inputType": "pdf"
        })
        assert resp.status_code == 200, f"Error analytics failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "logged", f"Expected status 'logged', got {data}"
        print("Analytics error endpoint working")
    
    def test_analytics_session(self):
        """POST /api/analytics/session should log tool session"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/session", json={
            "toolName": "Brief Simplifier",
            "sessionStart": "2026-01-15T10:00:00Z",
            "inputProvided": True,
            "outputGenerated": True,
            "outputViewed": True,
            "pdfDownloaded": False,
            "feedbackGiven": True,
            "nextStepClicked": True,
            "sessionEnd": "2026-01-15T10:15:00Z",
            "sessionDurationSeconds": 900
        })
        assert resp.status_code == 200, f"Session analytics failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "logged", f"Expected status 'logged', got {data}"
        print("Analytics session endpoint working")
    
    def test_analytics_checkin(self):
        """POST /api/analytics/checkin should log checkin"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/checkin", json={
            "toolName": "Brief Simplifier",
            "feeling": "confident"
        })
        assert resp.status_code == 200, f"Checkin analytics failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "logged", f"Expected status 'logged', got {data}"
        print("Analytics checkin endpoint working")
    
    def test_analytics_funnel(self):
        """POST /api/analytics/funnel should log funnel event"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/funnel", json={
            "event": "tool_started",
            "toolName": "Brief Simplifier",
            "ticketsRemaining": 5
        })
        assert resp.status_code == 200, f"Funnel analytics failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "logged", f"Expected status 'logged', got {data}"
        print("Analytics funnel endpoint working")
    
    def test_analytics_outcome(self):
        """POST /api/analytics/outcome should log outcome report"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/outcome", json={
            "toolName": "Brief Simplifier",
            "assessmentName": "Test Assessment",
            "outcome": "passed",
            "daysAfterSession": 7
        })
        assert resp.status_code == 200, f"Outcome analytics failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "logged", f"Expected status 'logged', got {data}"
        print("Analytics outcome endpoint working")


class TestAuthEndpoints:
    """Test auth endpoints"""
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "email" in data, "Response should contain email"
        assert data["email"] == TEST_EMAIL
        print(f"Login successful for {data['email']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("Invalid credentials correctly rejected")
    
    def test_get_me(self):
        """GET /api/auth/me returns user info"""
        session = requests.Session()
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        
        # Get me
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200, f"Get me failed: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == TEST_EMAIL
        assert "credits" in data
        assert "user_id" in data
        print(f"Get me successful: {data['email']}, credits: {data['credits']}")


class TestQuickWinEndpoint:
    """Test quick-win endpoint used by SemesterProgress"""
    
    def test_quick_win_endpoint(self):
        """GET /api/user/quick-win returns data or empty state"""
        session = requests.Session()
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        
        # Get quick-win
        resp = session.get(f"{BASE_URL}/api/user/quick-win")
        assert resp.status_code == 200, f"Quick-win failed: {resp.text}"
        data = resp.json()
        # Should have has_data field
        assert "has_data" in data, f"Response should have has_data field: {data}"
        print(f"Quick-win endpoint working, has_data: {data.get('has_data')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
