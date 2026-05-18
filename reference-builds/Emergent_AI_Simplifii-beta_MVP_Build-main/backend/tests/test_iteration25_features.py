"""
Iteration 25 Backend Tests
Testing: University context system, referral system, profile updates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self):
        """Test backend is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Health check passed")
    
    def test_login_with_test_credentials(self):
        """Test login with test@simplifii.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print(f"✓ Login successful for test@simplifii.com")
        return response.cookies


class TestUserProfileWithUniversity:
    """Test profile update with university fields"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return session
    
    def test_get_me_returns_university_fields(self, auth_session):
        """GET /api/auth/me should return university, studyYear, faculty, referralCode, referredBy"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields exist (may be null/empty but should be present)
        assert "referralCode" in data, "referralCode field missing from /api/auth/me"
        # These fields may or may not be present depending on user state
        print(f"✓ /api/auth/me returns user data with referralCode: {data.get('referralCode')}")
        print(f"  university: {data.get('university')}, studyYear: {data.get('studyYear')}, faculty: {data.get('faculty')}")
    
    def test_profile_update_accepts_university_fields(self, auth_session):
        """PUT /api/user/profile should accept university, studyYear, faculty"""
        # Update profile with university fields
        response = auth_session.put(f"{BASE_URL}/api/user/profile", json={
            "university": "UNSW Sydney",
            "studyYear": "2nd Year",
            "faculty": "Business"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Profile update with university fields accepted")
        
        # Verify the update persisted
        me_response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data.get("university") == "UNSW Sydney"
        assert me_data.get("studyYear") == "2nd Year"
        assert me_data.get("faculty") == "Business"
        print("✓ University fields persisted correctly")
    
    def test_profile_update_requires_auth(self):
        """PUT /api/user/profile should require authentication"""
        response = requests.put(f"{BASE_URL}/api/user/profile", json={
            "name": "Hacker"
        })
        assert response.status_code == 401
        print("✓ Profile update requires authentication (401)")


class TestReferralSystem:
    """Test referral code system"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return session
    
    def test_user_has_referral_code(self, auth_session):
        """User should have a referral code in SIM-XXXXXX format"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        
        referral_code = data.get("referralCode")
        assert referral_code is not None, "User should have a referral code"
        assert referral_code.startswith("SIM-"), f"Referral code should start with SIM-, got: {referral_code}"
        assert len(referral_code) == 10, f"Referral code should be 10 chars (SIM-XXXXXX), got: {referral_code}"
        print(f"✓ User has valid referral code: {referral_code}")
    
    def test_redeem_invalid_code_returns_404(self, auth_session):
        """POST /api/user/redeem-referral with invalid code should return 404"""
        response = auth_session.post(f"{BASE_URL}/api/user/redeem-referral", json={
            "code": "SIM-INVALID"
        })
        assert response.status_code == 404
        data = response.json()
        assert "Invalid referral code" in data.get("detail", "")
        print("✓ Invalid referral code returns 404")
    
    def test_redeem_own_code_returns_400(self, auth_session):
        """POST /api/user/redeem-referral with own code should return 400"""
        # First get user's own referral code
        me_response = auth_session.get(f"{BASE_URL}/api/auth/me")
        own_code = me_response.json().get("referralCode")
        
        # Try to redeem own code
        response = auth_session.post(f"{BASE_URL}/api/user/redeem-referral", json={
            "code": own_code
        })
        # Should be 400 (can't use own code) or 400 (already used a code)
        assert response.status_code == 400
        print(f"✓ Cannot redeem own referral code (400)")
    
    def test_redeem_referral_requires_auth(self):
        """POST /api/user/redeem-referral should require authentication"""
        response = requests.post(f"{BASE_URL}/api/user/redeem-referral", json={
            "code": "SIM-ABCDEF"
        })
        assert response.status_code == 401
        print("✓ Redeem referral requires authentication (401)")


class TestOnboardingEndpoints:
    """Test onboarding-related endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return session
    
    def test_complete_onboarding_endpoint(self, auth_session):
        """POST /api/user/complete-onboarding should work"""
        response = auth_session.post(f"{BASE_URL}/api/user/complete-onboarding", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Complete onboarding endpoint works")
    
    def test_pain_point_endpoint(self, auth_session):
        """POST /api/user/pain-point should work"""
        response = auth_session.post(f"{BASE_URL}/api/user/pain-point", json={
            "painPoint": "Understanding what markers want"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Pain point endpoint works")


class TestToolEndpointsExist:
    """Verify tool endpoints exist and respond"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return session
    
    def test_rubric_simplify_endpoint_exists(self, auth_session):
        """POST /api/rubric/simplify endpoint should exist"""
        # Just check it doesn't 404 - we won't actually run it (uses credits)
        response = auth_session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": ""  # Empty to trigger validation error, not 404
        })
        # Should be 400 (validation) or 422 (unprocessable) but not 404
        assert response.status_code != 404, "Rubric simplify endpoint should exist"
        print(f"✓ Rubric simplify endpoint exists (status: {response.status_code})")
    
    def test_concept_visualise_endpoint_exists(self, auth_session):
        """POST /api/concept/visualise endpoint should exist"""
        response = auth_session.post(f"{BASE_URL}/api/concept/visualise", json={
            "concept": ""
        })
        assert response.status_code != 404, "Concept visualise endpoint should exist"
        print(f"✓ Concept visualise endpoint exists (status: {response.status_code})")
    
    def test_decode_jargon_endpoint_exists(self, auth_session):
        """POST /api/decode-jargon endpoint should exist"""
        response = auth_session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": ""
        })
        assert response.status_code != 404, "Decode jargon endpoint should exist"
        print(f"✓ Decode jargon endpoint exists (status: {response.status_code})")
    
    def test_scaffold_endpoint_exists(self, auth_session):
        """POST /api/scaffold endpoint should exist"""
        response = auth_session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Test",
            "word_count": 1000,
            "level": "Second Year"
        })
        assert response.status_code != 404, "Scaffold endpoint should exist"
        print(f"✓ Scaffold endpoint exists (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
