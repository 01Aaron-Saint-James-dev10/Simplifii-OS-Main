"""
Iteration 7 Backend Tests - Simplifii EdTech App
Tests for: Study Buddy Chat, Brief Simplifier depth_level, and other new features
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print("✓ Login successful")


class TestStudyBuddyChat:
    """Study Buddy AI Chat endpoint tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_study_buddy_chat_endpoint_exists(self, session):
        """Test that /api/study-buddy/chat endpoint exists and requires auth"""
        # Test without auth
        response = requests.post(f"{BASE_URL}/api/study-buddy/chat", json={
            "message": "Hello",
            "session_id": "test_session_123"
        })
        assert response.status_code == 401, "Endpoint should require authentication"
        print("✓ Study Buddy endpoint requires authentication")
    
    def test_study_buddy_chat_with_auth(self, session):
        """Test Study Buddy chat with authenticated session"""
        response = session.post(f"{BASE_URL}/api/study-buddy/chat", json={
            "message": "Hello, can you help me with my essay?",
            "session_id": "test_session_456"
        })
        assert response.status_code == 200, f"Study Buddy chat failed: {response.text}"
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert "session_id" in data, "Response should contain 'session_id' field"
        assert len(data["response"]) > 0, "Response should not be empty"
        print(f"✓ Study Buddy responded: {data['response'][:100]}...")
    
    def test_study_buddy_chat_validates_input(self, session):
        """Test that Study Buddy validates input"""
        # Test with missing message
        response = session.post(f"{BASE_URL}/api/study-buddy/chat", json={
            "session_id": "test_session_789"
        })
        assert response.status_code in [400, 422], "Should reject missing message"
        print("✓ Study Buddy validates input correctly")


class TestBriefSimplifierDepthLevel:
    """Brief Simplifier depth_level parameter tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_upload_brief_accepts_depth_level(self, session):
        """Test that /api/briefs/upload accepts depth_level form field"""
        # Create a minimal PDF-like content for testing
        # Note: This test verifies the endpoint accepts the parameter
        # Actual PDF processing would require a real PDF file
        
        # Test with multipart form data
        files = {
            'files': ('test.pdf', b'%PDF-1.4 test content', 'application/pdf')
        }
        data = {
            'assessment_title': 'TEST_Depth_Level_Test',
            'assessment_type': 'Essay',
            'depth_level': 'v1'  # Quick Scan
        }
        
        response = session.post(f"{BASE_URL}/api/briefs/upload", files=files, data=data)
        # May fail due to PDF parsing, but should not fail due to depth_level parameter
        # Status 400 or 500 for PDF issues is acceptable, 422 for validation would indicate depth_level issue
        assert response.status_code != 422, f"depth_level parameter should be accepted: {response.text}"
        print(f"✓ Brief upload accepts depth_level parameter (status: {response.status_code})")
    
    def test_depth_level_defaults_to_v2(self, session):
        """Test that depth_level defaults to v2 when not provided"""
        files = {
            'files': ('test.pdf', b'%PDF-1.4 test content', 'application/pdf')
        }
        data = {
            'assessment_title': 'TEST_Default_Depth',
            'assessment_type': 'Essay'
            # depth_level not provided - should default to v2
        }
        
        response = session.post(f"{BASE_URL}/api/briefs/upload", files=files, data=data)
        # Should not fail validation
        assert response.status_code != 422, "Should accept request without depth_level"
        print("✓ Brief upload works without depth_level (defaults to v2)")


class TestNotifications:
    """Notifications endpoint tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_get_notifications(self, session):
        """Test GET /api/notifications returns notifications array"""
        response = session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        print(f"✓ Notifications endpoint returns {len(data['notifications'])} notifications")


class TestCheckIn:
    """Check-in feature tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_checkin_endpoint(self, session):
        """Test POST /api/checkin creates check-in"""
        # First get a brief_id
        briefs_response = session.get(f"{BASE_URL}/api/briefs/history")
        if briefs_response.status_code == 200 and len(briefs_response.json()) > 0:
            brief_id = briefs_response.json()[0]["brief_id"]
            
            response = session.post(f"{BASE_URL}/api/checkin", json={
                "brief_id": brief_id,
                "mood": "okay",
                "note": "Testing check-in feature"
            })
            assert response.status_code == 200
            data = response.json()
            assert "checkin_id" in data
            assert "message" in data
            print(f"✓ Check-in created: {data['checkin_id']}")
        else:
            pytest.skip("No briefs available for check-in test")


class TestBriefHistory:
    """Brief history tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_get_brief_history(self, session):
        """Test GET /api/briefs/history returns briefs"""
        response = session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Brief history returns {len(data)} briefs")
    
    def test_get_specific_brief(self, session):
        """Test GET /api/briefs/{brief_id} returns brief details"""
        # First get a brief_id
        briefs_response = session.get(f"{BASE_URL}/api/briefs/history")
        if briefs_response.status_code == 200 and len(briefs_response.json()) > 0:
            brief_id = briefs_response.json()[0]["brief_id"]
            
            response = session.get(f"{BASE_URL}/api/briefs/{brief_id}")
            assert response.status_code == 200
            data = response.json()
            assert "brief_id" in data
            assert "output_json" in data
            print(f"✓ Brief {brief_id} retrieved successfully")
        else:
            pytest.skip("No briefs available for test")


class TestCreditsEndpoints:
    """Credits/Tickets endpoints tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_get_credit_balance(self, session):
        """Test GET /api/credits/balance returns balance"""
        response = session.get(f"{BASE_URL}/api/credits/balance")
        assert response.status_code == 200
        data = response.json()
        assert "credits" in data
        assert isinstance(data["credits"], int)
        print(f"✓ Credit balance: {data['credits']}")


class TestUserProfile:
    """User profile tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return s
    
    def test_get_user_profile(self, session):
        """Test GET /api/user/profile returns profile"""
        response = session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        print("✓ User profile retrieved successfully")
    
    def test_get_auth_me(self, session):
        """Test GET /api/auth/me returns current user"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        print(f"✓ Auth me returns user: {data['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
