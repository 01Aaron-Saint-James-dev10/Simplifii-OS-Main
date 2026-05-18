"""
Pre-Deployment Audit Backend Tests - Simplifii EdTech App (Iteration 8)
Full coverage of all API endpoints for deployment readiness
"""
import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ============ AUTH TESTS ============

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print("✓ Login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test@simplifii.com",
            "password": "test123",
            "name": "Test User"
        })
        assert response.status_code == 400
        print("✓ Duplicate email registration rejected")
    
    def test_auth_me_requires_auth(self):
        """Test /auth/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me requires authentication")


# ============ AUTHENTICATED SESSION FIXTURE ============

@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for all tests"""
    s = requests.Session()
    response = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@simplifii.com",
        "password": "test123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return s


# ============ RUBRIC SIMPLIFIER TESTS ============

class TestRubricSimplifier:
    """Rubric Simplifier endpoint tests"""
    
    def test_rubric_simplify_requires_auth(self):
        """Test /rubric/simplify requires authentication"""
        response = requests.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": "Test rubric"
        })
        assert response.status_code == 401
        print("✓ Rubric simplify requires auth")
    
    def test_rubric_simplify_success(self, auth_session):
        """Test rubric simplification returns new format with sections"""
        rubric_text = """
        Criterion 1: Critical Analysis (30%)
        - HD: Demonstrates exceptional critical analysis
        - D: Shows strong analytical skills
        - C: Adequate analysis present
        - P: Basic analysis shown
        
        Criterion 2: Research Quality (40%)
        - HD: Extensive, high-quality sources
        - D: Good range of sources
        - C: Adequate sources
        - P: Minimal sources
        
        Criterion 3: Writing Quality (30%)
        - HD: Exceptional clarity and structure
        - D: Clear and well-structured
        - C: Generally clear
        - P: Basic clarity
        """
        response = auth_session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": rubric_text
        })
        assert response.status_code == 200, f"Rubric simplify failed: {response.text}"
        data = response.json()
        
        # Verify new format with sections array
        assert "sections" in data, "Response should contain 'sections' array"
        assert isinstance(data["sections"], list), "sections should be an array"
        assert len(data["sections"]) > 0, "sections should not be empty"
        
        # Verify section structure
        section = data["sections"][0]
        assert "name" in section, "Section should have 'name'"
        assert "steps" in section, "Section should have 'steps'"
        assert "totalPoints" in section or "weighting" in section, "Section should have points/weighting"
        
        print(f"✓ Rubric simplified with {len(data['sections'])} sections")


# ============ ESSAY SCORER TESTS ============

class TestEssayScorer:
    """Essay Scorer endpoint tests"""
    
    def test_essay_score_requires_auth(self):
        """Test /essay/score requires authentication"""
        response = requests.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": "Test essay",
            "rubric_text": "Test rubric"
        })
        assert response.status_code == 401
        print("✓ Essay score requires auth")
    
    def test_essay_score_success(self, auth_session):
        """Test essay scoring returns feedback"""
        response = auth_session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": "This is a test essay about climate change. Climate change is a significant global issue that affects all aspects of human life. The scientific consensus is clear that human activities are contributing to global warming.",
            "rubric_text": "Critical Analysis (40%): Demonstrates understanding of the topic. Research (30%): Uses appropriate sources. Writing (30%): Clear and coherent."
        })
        assert response.status_code == 200, f"Essay score failed: {response.text}"
        data = response.json()
        
        assert "overallFeedback" in data or "criteriaFeedback" in data, "Response should contain feedback"
        print("✓ Essay scored successfully")


# ============ HUMANISER TESTS ============

class TestHumaniser:
    """Humaniser endpoint tests"""
    
    def test_humanise_requires_auth(self):
        """Test /humanise requires authentication"""
        response = requests.post(f"{BASE_URL}/api/humanise", json={
            "text": "Test text"
        })
        assert response.status_code == 401
        print("✓ Humanise requires auth")
    
    def test_humanise_success(self, auth_session):
        """Test humanisation returns rewritten text"""
        response = auth_session.post(f"{BASE_URL}/api/humanise", json={
            "text": "The implementation of sustainable practices within organizational frameworks necessitates a comprehensive understanding of environmental factors."
        })
        assert response.status_code == 200, f"Humanise failed: {response.text}"
        data = response.json()
        
        assert "humanised" in data, "Response should contain 'humanised' text"
        assert len(data["humanised"]) > 0, "Humanised text should not be empty"
        print("✓ Text humanised successfully")


# ============ ASSESSMENT SCAFFOLDER TESTS ============

class TestAssessmentScaffolder:
    """Assessment Scaffolder endpoint tests"""
    
    def test_scaffold_requires_auth(self):
        """Test /scaffold requires authentication"""
        response = requests.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Climate Change",
            "word_count": 2000,
            "level": "Undergraduate"
        })
        assert response.status_code == 401
        print("✓ Scaffold requires auth")
    
    def test_scaffold_success(self, auth_session):
        """Test scaffolding returns structure"""
        response = auth_session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Climate Change",
            "word_count": 2000,
            "level": "Undergraduate"
        })
        assert response.status_code == 200, f"Scaffold failed: {response.text}"
        data = response.json()
        
        assert "suggestedStructure" in data, "Response should contain 'suggestedStructure'"
        assert isinstance(data["suggestedStructure"], list), "suggestedStructure should be an array"
        print(f"✓ Scaffold created with {len(data['suggestedStructure'])} sections")


# ============ STUDY BUDDY TESTS ============

class TestStudyBuddy:
    """Study Buddy Chat endpoint tests"""
    
    def test_study_buddy_requires_auth(self):
        """Test /study-buddy/chat requires authentication"""
        response = requests.post(f"{BASE_URL}/api/study-buddy/chat", json={
            "message": "Hello",
            "session_id": "test_session"
        })
        assert response.status_code == 401
        print("✓ Study Buddy requires auth")
    
    def test_study_buddy_chat_success(self, auth_session):
        """Test Study Buddy returns AI response"""
        response = auth_session.post(f"{BASE_URL}/api/study-buddy/chat", json={
            "message": "Can you help me with my essay structure?",
            "session_id": f"test_session_{int(time.time())}"
        })
        assert response.status_code == 200, f"Study Buddy failed: {response.text}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response'"
        assert "session_id" in data, "Response should contain 'session_id'"
        assert len(data["response"]) > 0, "Response should not be empty"
        print("✓ Study Buddy responded successfully")


# ============ CHECK-IN TESTS ============

class TestCheckIn:
    """Check-in endpoint tests"""
    
    def test_checkin_requires_auth(self):
        """Test /checkin requires authentication"""
        response = requests.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_brief",
            "mood": "okay"
        })
        assert response.status_code == 401
        print("✓ Check-in requires auth")
    
    def test_checkin_success(self, auth_session):
        """Test check-in returns mood response"""
        response = auth_session.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_brief_123",
            "mood": "okay",
            "note": "Feeling productive today"
        })
        assert response.status_code == 200, f"Check-in failed: {response.text}"
        data = response.json()
        
        assert "checkin_id" in data, "Response should contain 'checkin_id'"
        assert "message" in data, "Response should contain 'message'"
        print("✓ Check-in recorded successfully")
    
    def test_checkin_mood_responses(self, auth_session):
        """Test different mood responses"""
        moods = ["great", "okay", "struggling", "overwhelmed"]
        for mood in moods:
            response = auth_session.post(f"{BASE_URL}/api/checkin", json={
                "brief_id": f"test_brief_{mood}",
                "mood": mood
            })
            assert response.status_code == 200, f"Check-in for mood '{mood}' failed"
            data = response.json()
            assert "message" in data
        print("✓ All mood responses working")


# ============ EXPORT TESTS ============

class TestExports:
    """Brief export endpoint tests"""
    
    def test_export_pdf_requires_auth(self):
        """Test PDF export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/briefs/export/test_id/pdf")
        assert response.status_code == 401
        print("✓ PDF export requires auth")
    
    def test_export_docx_requires_auth(self):
        """Test DOCX export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/briefs/export/test_id/docx")
        assert response.status_code == 401
        print("✓ DOCX export requires auth")
    
    def test_export_with_valid_brief(self, auth_session):
        """Test export with a valid brief ID"""
        # First get a brief from history
        history_response = auth_session.get(f"{BASE_URL}/api/briefs/history")
        assert history_response.status_code == 200, "Failed to get brief history"
        
        briefs = history_response.json()
        if len(briefs) > 0:
            brief_id = briefs[0]["brief_id"]
            
            # Test PDF export
            pdf_response = auth_session.get(f"{BASE_URL}/api/briefs/export/{brief_id}/pdf")
            assert pdf_response.status_code == 200, f"PDF export failed: {pdf_response.text}"
            assert "application/pdf" in pdf_response.headers.get("content-type", "")
            print(f"✓ PDF export successful for brief {brief_id}")
            
            # Test DOCX export
            docx_response = auth_session.get(f"{BASE_URL}/api/briefs/export/{brief_id}/docx")
            assert docx_response.status_code == 200, f"DOCX export failed: {docx_response.text}"
            assert "application/vnd.openxmlformats" in docx_response.headers.get("content-type", "")
            print(f"✓ DOCX export successful for brief {brief_id}")
        else:
            pytest.skip("No briefs available for export test")


# ============ CREDITS/TICKETS TESTS ============

class TestCredits:
    """Credits/Tickets endpoint tests"""
    
    def test_credits_balance_requires_auth(self):
        """Test /credits/balance requires authentication"""
        response = requests.get(f"{BASE_URL}/api/credits/balance")
        assert response.status_code == 401
        print("✓ Credits balance requires auth")
    
    def test_credits_balance_success(self, auth_session):
        """Test getting credit balance"""
        response = auth_session.get(f"{BASE_URL}/api/credits/balance")
        assert response.status_code == 200, f"Credits balance failed: {response.text}"
        data = response.json()
        
        assert "credits" in data, "Response should contain 'credits'"
        assert isinstance(data["credits"], int), "Credits should be an integer"
        print(f"✓ Credits balance: {data['credits']}")


# ============ NOTIFICATIONS TESTS ============

class TestNotifications:
    """Notifications endpoint tests"""
    
    def test_notifications_requires_auth(self):
        """Test /notifications requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("✓ Notifications requires auth")
    
    def test_notifications_success(self, auth_session):
        """Test getting notifications"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Notifications failed: {response.text}"
        data = response.json()
        
        assert "notifications" in data, "Response should contain 'notifications'"
        assert isinstance(data["notifications"], list), "Notifications should be an array"
        print(f"✓ Got {len(data['notifications'])} notifications")


# ============ HIDDEN CURRICULUM DECODER TESTS ============

class TestHiddenCurriculumDecoder:
    """Hidden Curriculum Decoder endpoint tests"""
    
    def test_decode_jargon_requires_auth(self):
        """Test /decode-jargon requires authentication"""
        response = requests.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": "Test text"
        })
        assert response.status_code == 401
        print("✓ Decode jargon requires auth")
    
    def test_decode_jargon_success(self, auth_session):
        """Test decoding academic jargon"""
        response = auth_session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": "Students are expected to demonstrate critical engagement with the literature and synthesise diverse perspectives in their analysis."
        })
        assert response.status_code == 200, f"Decode jargon failed: {response.text}"
        data = response.json()
        
        assert "decodedTerms" in data or "hiddenExpectations" in data, "Response should contain decoded content"
        print("✓ Jargon decoded successfully")


# ============ COURSE PLANNER TESTS ============

class TestCoursePlanner:
    """Course Planner endpoint tests"""
    
    def test_course_planner_ics_export_requires_auth(self):
        """Test ICS export requires authentication"""
        response = requests.post(f"{BASE_URL}/api/course-planner/export-ics", json={
            "briefs": []
        })
        assert response.status_code == 401
        print("✓ ICS export requires auth")


# ============ BRIEF HISTORY TESTS ============

class TestBriefHistory:
    """Brief history endpoint tests"""
    
    def test_brief_history_requires_auth(self):
        """Test /briefs/history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 401
        print("✓ Brief history requires auth")
    
    def test_brief_history_success(self, auth_session):
        """Test getting brief history"""
        response = auth_session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200, f"Brief history failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be an array"
        if len(data) > 0:
            brief = data[0]
            assert "brief_id" in brief, "Brief should have 'brief_id'"
            assert "assessment_title" in brief, "Brief should have 'assessment_title'"
        print(f"✓ Got {len(data)} briefs in history")


# ============ UNIVERSITIES TESTS ============

class TestUniversities:
    """Universities endpoint tests"""
    
    def test_universities_list(self):
        """Test getting universities list (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/universities")
        assert response.status_code == 200, f"Universities list failed: {response.text}"
        data = response.json()
        
        assert "universities" in data, "Response should contain 'universities'"
        assert len(data["universities"]) > 0, "Should have universities"
        print(f"✓ Got {len(data['universities'])} universities")


# ============ USER PROFILE TESTS ============

class TestUserProfile:
    """User profile endpoint tests"""
    
    def test_user_profile_requires_auth(self):
        """Test /user/profile requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 401
        print("✓ User profile requires auth")
    
    def test_user_profile_success(self, auth_session):
        """Test getting user profile"""
        response = auth_session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200, f"User profile failed: {response.text}"
        data = response.json()
        
        assert "user" in data, "Response should contain 'user'"
        print("✓ User profile retrieved successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
