"""
Simplifii API Tests - Backend Testing
Tests for authentication, briefs, credits, and AI guidance endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@simplifii.com"
TEST_PASSWORD = "test123"


class TestHealthAndAuth:
    """Authentication and basic health tests"""
    
    def test_api_accessible(self):
        """Test that API is accessible"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        # Should return 401 without auth, not 500
        assert response.status_code in [200, 401], f"API not accessible: {response.status_code}"
        print(f"API accessible - status: {response.status_code}")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "user_id not in response"
        assert "email" in data, "email not in response"
        assert data["email"] == TEST_EMAIL
        assert "credits" in data, "credits not in response"
        print(f"Login successful - user: {data['email']}, credits: {data['credits']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpass"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Invalid credentials correctly rejected")
    
    def test_auth_me_without_session(self):
        """Test /auth/me without session returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated /auth/me correctly returns 401")


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.user = response.json()
        print(f"Authenticated as: {self.user['email']}")
    
    def test_auth_me_with_session(self):
        """Test /auth/me with valid session"""
        response = self.session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"Auth/me successful - user: {data['email']}")
    
    def test_credits_balance(self):
        """Test getting credit balance"""
        response = self.session.get(f"{BASE_URL}/api/credits/balance", timeout=10)
        assert response.status_code == 200, f"Credits balance failed: {response.text}"
        
        data = response.json()
        assert "credits" in data
        assert isinstance(data["credits"], int)
        print(f"Credits balance: {data['credits']}")
    
    def test_briefs_history(self):
        """Test getting briefs history"""
        response = self.session.get(f"{BASE_URL}/api/briefs/history", timeout=10)
        assert response.status_code == 200, f"Briefs history failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Briefs history count: {len(data)}")
        
        if len(data) > 0:
            brief = data[0]
            assert "brief_id" in brief
            assert "assessment_title" in brief
            assert "assessment_type" in brief
            print(f"First brief: {brief['assessment_title']}")
    
    def test_get_specific_brief(self):
        """Test getting a specific brief by ID"""
        # First get history to find a brief ID
        history_response = self.session.get(f"{BASE_URL}/api/briefs/history", timeout=10)
        assert history_response.status_code == 200
        
        briefs = history_response.json()
        if len(briefs) == 0:
            pytest.skip("No briefs available to test")
        
        brief_id = briefs[0]["brief_id"]
        
        # Get specific brief
        response = self.session.get(f"{BASE_URL}/api/briefs/{brief_id}", timeout=10)
        assert response.status_code == 200, f"Get brief failed: {response.text}"
        
        data = response.json()
        assert data["brief_id"] == brief_id
        assert "output_json" in data
        assert "weeklyPlan" in data["output_json"]
        print(f"Got brief: {data['assessment_title']}")
    
    def test_logout(self):
        """Test logout endpoint"""
        response = self.session.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        assert response.status_code == 200, f"Logout failed: {response.text}"
        
        data = response.json()
        assert "message" in data
        print("Logout successful")
        
        # Verify session is invalidated
        me_response = self.session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert me_response.status_code == 401, "Session should be invalidated after logout"
        print("Session correctly invalidated after logout")


class TestAIGuidanceEndpoint:
    """Tests for the AI Guidance endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
    
    def test_ai_guidance_endpoint_exists(self):
        """Test that AI guidance endpoint exists and accepts requests"""
        response = self.session.post(
            f"{BASE_URL}/api/briefs/ai-guidance",
            json={
                "task": "Research and select fictional tech startup concept",
                "assessment_title": "Marketing Strategy Essay",
                "assessment_type": "Essay"
            },
            timeout=30  # AI calls can take time
        )
        assert response.status_code == 200, f"AI guidance failed: {response.text}"
        
        data = response.json()
        assert "guidance" in data, "guidance not in response"
        assert len(data["guidance"]) > 0, "guidance is empty"
        print(f"AI Guidance received: {data['guidance'][:100]}...")
    
    def test_ai_guidance_returns_text(self):
        """Test that AI guidance returns meaningful text"""
        response = self.session.post(
            f"{BASE_URL}/api/briefs/ai-guidance",
            json={
                "task": "Begin academic source collection",
                "assessment_title": "Marketing Strategy Essay",
                "assessment_type": "Essay"
            },
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        guidance = data["guidance"]
        
        # Check guidance is meaningful (not just error message)
        assert len(guidance) > 50, "Guidance too short"
        assert "error" not in guidance.lower() or "unable" not in guidance.lower(), "Guidance contains error"
        print(f"AI Guidance quality check passed - length: {len(guidance)}")


class TestCreditsPurchase:
    """Tests for credits purchase flow"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200
    
    def test_purchase_creates_checkout_session(self):
        """Test that purchase endpoint creates Stripe checkout session"""
        form_data = {
            "package_id": "small",
            "origin_url": "https://udl-magic.preview.emergentagent.com"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/credits/purchase",
            data=form_data,
            timeout=15
        )
        assert response.status_code == 200, f"Purchase failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Checkout URL not in response"
        assert "session_id" in data, "Session ID not in response"
        assert "stripe.com" in data["url"], "URL should be Stripe checkout"
        print(f"Checkout session created: {data['session_id']}")
    
    def test_invalid_package_rejected(self):
        """Test that invalid package ID is rejected"""
        form_data = {
            "package_id": "invalid_package",
            "origin_url": "https://udl-magic.preview.emergentagent.com"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/credits/purchase",
            data=form_data,
            timeout=15
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("Invalid package correctly rejected")


class TestBreakDownTask:
    """Tests for task breakdown endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200
    
    def test_break_down_task(self):
        """Test breaking down a task into micro-steps"""
        response = self.session.post(
            f"{BASE_URL}/api/briefs/break-down",
            json={"task": "Research and select fictional tech startup concept"},
            timeout=30
        )
        assert response.status_code == 200, f"Break down failed: {response.text}"
        
        data = response.json()
        assert "microSteps" in data, "microSteps not in response"
        assert isinstance(data["microSteps"], list), "microSteps should be a list"
        assert len(data["microSteps"]) >= 1, "Should have at least 1 micro-step"
        print(f"Task broken down into {len(data['microSteps'])} micro-steps")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
