"""
Iteration 3 Backend Tests - New Features
Tests for: University Selector, Hidden Curriculum Decoder, Translation, ICS Export, User Profile
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://udl-magic.preview.emergentagent.com')

class TestUniversities:
    """University endpoint tests"""
    
    def test_list_universities_returns_40(self):
        """Test /api/universities returns 40 universities"""
        response = requests.get(f"{BASE_URL}/api/universities")
        assert response.status_code == 200
        data = response.json()
        assert "universities" in data
        assert len(data["universities"]) == 40
    
    def test_list_universities_has_8_go8(self):
        """Test /api/universities has 8 Go8 universities"""
        response = requests.get(f"{BASE_URL}/api/universities")
        assert response.status_code == 200
        data = response.json()
        go8_unis = [u for u in data["universities"] if u.get("group") == "Go8"]
        assert len(go8_unis) == 8
    
    def test_university_structure(self):
        """Test university object has correct structure"""
        response = requests.get(f"{BASE_URL}/api/universities")
        assert response.status_code == 200
        data = response.json()
        uni = data["universities"][0]
        assert "id" in uni
        assert "name" in uni
        assert "group" in uni


class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
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
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401


class TestUserProfile:
    """User profile and university selection tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return s
    
    def test_update_university(self, session):
        """Test POST /api/user/university"""
        response = session.post(f"{BASE_URL}/api/user/university", json={
            "university": "University of Sydney"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["university"] == "University of Sydney"
    
    def test_get_user_profile(self, session):
        """Test GET /api/user/profile returns onboarding status"""
        response = session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "university" in data
        assert "onboarding_complete" in data
        assert "neurotype" in data
        assert "preferences" in data


class TestHiddenCurriculumDecoder:
    """Hidden Curriculum Decoder tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return s
    
    def test_decode_jargon_success(self, session):
        """Test POST /api/decode-jargon returns decoded terms"""
        response = session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": "Students must demonstrate critical analysis and synthesis of scholarly literature."
        })
        assert response.status_code == 200
        data = response.json()
        assert "decodedTerms" in data
        assert "hiddenExpectations" in data
        assert "actionSummary" in data
        assert len(data["decodedTerms"]) > 0
    
    def test_decode_jargon_requires_auth(self):
        """Test /api/decode-jargon requires authentication"""
        response = requests.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": "Test text"
        })
        assert response.status_code == 401


class TestTranslation:
    """Translation endpoint tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return s
    
    def test_translate_success(self, session):
        """Test POST /api/translate returns translated text"""
        response = session.post(f"{BASE_URL}/api/translate", json={
            "text": "This is a test assessment brief.",
            "target_language": "Chinese (Simplified)"
        })
        assert response.status_code == 200
        data = response.json()
        assert "translated" in data
        assert "target_language" in data
        assert data["target_language"] == "Chinese (Simplified)"
        assert len(data["translated"]) > 0
    
    def test_translate_requires_auth(self):
        """Test /api/translate requires authentication"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Test",
            "target_language": "Spanish"
        })
        assert response.status_code == 401


class TestICSExport:
    """ICS Calendar Export tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return s
    
    def test_export_ics_success(self, session):
        """Test POST /api/course-planner/export-ics returns valid ICS"""
        response = session.post(f"{BASE_URL}/api/course-planner/export-ics", json={
            "briefs": [
                {"title": "Marketing Essay", "type": "Essay", "dueDate": "Week 10", "weighting": "40%"},
                {"title": "Research Report", "type": "Report", "dueDate": "Week 12", "weighting": "30%"}
            ]
        })
        assert response.status_code == 200
        content = response.text
        assert "BEGIN:VCALENDAR" in content
        assert "END:VCALENDAR" in content
        assert "Marketing Essay" in content
        assert "Research Report" in content
    
    def test_export_ics_requires_auth(self):
        """Test /api/course-planner/export-ics requires authentication"""
        response = requests.post(f"{BASE_URL}/api/course-planner/export-ics", json={
            "briefs": []
        })
        assert response.status_code == 401


class TestBriefHistory:
    """Brief history and results tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return s
    
    def test_get_brief_history(self, session):
        """Test GET /api/briefs/history returns user's briefs"""
        response = session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            brief = data[0]
            assert "brief_id" in brief
            assert "assessment_title" in brief
            assert "output_json" in brief
    
    def test_get_specific_brief(self, session):
        """Test GET /api/briefs/{brief_id} returns brief with output_json"""
        # First get history to find a brief_id
        history_response = session.get(f"{BASE_URL}/api/briefs/history")
        if history_response.status_code == 200 and len(history_response.json()) > 0:
            brief_id = history_response.json()[0]["brief_id"]
            response = session.get(f"{BASE_URL}/api/briefs/{brief_id}")
            assert response.status_code == 200
            data = response.json()
            assert "output_json" in data
            assert "weeklyPlan" in data["output_json"]


class TestNeurotype:
    """Neurotype preference tests"""
    
    @pytest.fixture
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return s
    
    def test_save_neurotype(self, session):
        """Test POST /api/user/neurotype saves preferences"""
        response = session.post(f"{BASE_URL}/api/user/neurotype", json={
            "neurotype": "adhd",
            "preferences": {"showOneTaskAtTime": True, "gamification": True}
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
    
    def test_get_neurotype(self, session):
        """Test GET /api/user/neurotype returns preferences"""
        response = session.get(f"{BASE_URL}/api/user/neurotype")
        assert response.status_code == 200
        data = response.json()
        assert "neurotype" in data or data.get("neurotype") is None
        assert "preferences" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
