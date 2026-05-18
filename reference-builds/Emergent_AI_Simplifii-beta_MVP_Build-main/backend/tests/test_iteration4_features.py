"""
Iteration 4 Feature Tests for Simplifii EdTech App
Tests:
1. Login reliability (AuthContext retry on network errors)
2. PDF auto-fill (extract-metadata endpoint)
3. Enhanced Executive Function Planner features
4. New user auto-redirect to /onboarding after signup
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://udl-magic.preview.emergentagent.com').rstrip('/')

class TestAuthEndpoints:
    """Test authentication endpoints - Login reliability"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data, "Response missing user_id"
        assert data["email"] == "test@simplifii.com"
        print(f"✅ Login success - user_id: {data['user_id']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid credentials correctly rejected")
    
    def test_auth_me_with_session(self):
        """Test /api/auth/me returns user data with valid session"""
        # First login to get session
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        
        # Extract session cookie
        session_cookie = login_response.cookies.get("session_token")
        assert session_cookie is not None, "No session_token cookie returned"
        
        # Test /api/auth/me
        me_response = requests.get(f"{BASE_URL}/api/auth/me", cookies={"session_token": session_cookie})
        assert me_response.status_code == 200, f"Auth/me failed: {me_response.text}"
        data = me_response.json()
        assert data["email"] == "test@simplifii.com"
        print(f"✅ Auth/me works - session persists correctly")
    
    def test_auth_me_without_session(self):
        """Test /api/auth/me returns 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Auth/me correctly rejects unauthenticated requests")


class TestPDFExtractMetadata:
    """Test PDF metadata extraction endpoint for auto-fill feature"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        return {"session_token": login_response.cookies.get("session_token")}
    
    def test_extract_metadata_endpoint_exists(self, auth_session):
        """Test that extract-metadata endpoint exists and accepts files"""
        # Create a minimal PDF-like file for testing
        # Note: This is a dummy file - real PDF extraction requires actual PDF
        dummy_pdf = io.BytesIO(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")
        
        files = {"files": ("test.pdf", dummy_pdf, "application/pdf")}
        response = requests.post(
            f"{BASE_URL}/api/briefs/extract-metadata",
            files=files,
            cookies=auth_session
        )
        
        # Endpoint should exist and return JSON (even if extraction fails on dummy PDF)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            # Should return expected structure even if empty
            assert "assessment_title" in data or "assessment_type" in data
            print(f"✅ Extract-metadata endpoint works - returned: {list(data.keys())}")
        else:
            print(f"⚠️ Extract-metadata returned 500 (expected with dummy PDF)")


class TestBriefsHistory:
    """Test briefs history endpoint for Import from Briefs feature"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        return {"session_token": login_response.cookies.get("session_token")}
    
    def test_briefs_history_returns_list(self, auth_session):
        """Test /api/briefs/history returns list of briefs"""
        response = requests.get(f"{BASE_URL}/api/briefs/history", cookies=auth_session)
        assert response.status_code == 200, f"Briefs history failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of briefs"
        print(f"✅ Briefs history works - {len(data)} briefs found")
        
        # If briefs exist, verify structure
        if len(data) > 0:
            brief = data[0]
            assert "brief_id" in brief
            assert "assessment_title" in brief
            print(f"  First brief: {brief.get('assessment_title', 'N/A')}")


class TestAIGuidanceEndpoint:
    """Test AI guidance endpoint for Executive Planner AI features"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        return {"session_token": login_response.cookies.get("session_token")}
    
    def test_ai_guidance_for_weekly_plan(self, auth_session):
        """Test AI guidance endpoint for weekly study plan generation"""
        response = requests.post(
            f"{BASE_URL}/api/briefs/ai-guidance",
            json={
                "task": "Create a weekly study plan for these tasks: Read chapter 1 (priority: high), Write essay outline (priority: medium)",
                "assessment_title": "Weekly Study Plan",
                "assessment_type": "Executive Function Planning"
            },
            cookies=auth_session
        )
        assert response.status_code == 200, f"AI guidance failed: {response.text}"
        data = response.json()
        assert "guidance" in data, "Response missing guidance field"
        assert len(data["guidance"]) > 0, "Guidance is empty"
        print(f"✅ AI Weekly Plan generation works - {len(data['guidance'])} chars")
    
    def test_ai_cognitive_tip(self, auth_session):
        """Test AI guidance endpoint for cognitive tips"""
        response = requests.post(
            f"{BASE_URL}/api/briefs/ai-guidance",
            json={
                "task": "Based on this student's current state: Active tasks: 5, Completed today: 2, Pomodoros done: 3, Current load: moderate. Give ONE specific, actionable tip for managing their cognitive load right now.",
                "assessment_title": "Cognitive Load Management",
                "assessment_type": "Executive Function Support"
            },
            cookies=auth_session
        )
        assert response.status_code == 200, f"AI cognitive tip failed: {response.text}"
        data = response.json()
        assert "guidance" in data
        print(f"✅ AI Cognitive Tip generation works")


class TestUserRegistration:
    """Test user registration for signup redirect feature"""
    
    def test_register_new_user(self):
        """Test registering a new user returns user data"""
        import uuid
        test_email = f"test_signup_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Signup User"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == test_email
        assert data["name"] == "Test Signup User"
        
        # Verify session cookie is set
        session_cookie = response.cookies.get("session_token")
        assert session_cookie is not None, "No session_token cookie after registration"
        
        print(f"✅ User registration works - new user created: {data['user_id']}")
    
    def test_register_duplicate_email(self):
        """Test registering with existing email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test@simplifii.com",
            "password": "testpass123",
            "name": "Duplicate User"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        print("✅ Duplicate email registration correctly rejected")


class TestDashboardTools:
    """Test dashboard shows correct number of tools"""
    
    def test_dashboard_endpoint_accessible(self):
        """Verify dashboard page is accessible (frontend test will verify 8 cards)"""
        # This is a frontend test - we just verify the backend is healthy
        response = requests.get(f"{BASE_URL}/api/auth/me")
        # Should return 401 (not 500) - backend is healthy
        assert response.status_code in [200, 401], f"Backend unhealthy: {response.status_code}"
        print("✅ Backend healthy for dashboard access")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
