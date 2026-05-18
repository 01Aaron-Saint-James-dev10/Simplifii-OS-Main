"""
Iteration 6 Tests - Simplifii EdTech App
Features tested:
1. Credits renamed to 'Tickets' (frontend only - backend still uses 'credits')
2. Check-in endpoint for mood tracking
3. Rubric Simplifier new format (sections with steps, points, tips)
4. Notifications endpoint
5. Auth endpoints
"""

import pytest
import requests
import os

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
        assert "email" in data
        assert data["email"] == "test@simplifii.com"
        assert "credits" in data  # Backend still uses 'credits' internally
        print(f"Login successful - user_id: {data['user_id']}, credits: {data['credits']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")
    
    def test_auth_me_without_session(self):
        """Test /auth/me without session returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("Unauthenticated /auth/me correctly returns 401")


class TestCheckIn:
    """Check-in endpoint tests for mood tracking"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login first
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, "Login failed for check-in tests"
    
    def test_checkin_great_mood(self):
        """Test check-in with 'great' mood"""
        response = self.session.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_brief_123",
            "mood": "great",
            "note": "Feeling productive today!"
        })
        assert response.status_code == 200, f"Check-in failed: {response.text}"
        data = response.json()
        assert "checkin_id" in data
        assert "message" in data
        assert data["checkin_id"].startswith("ci_")
        print(f"Check-in successful - ID: {data['checkin_id']}, Message: {data['message']}")
    
    def test_checkin_struggling_mood(self):
        """Test check-in with 'struggling' mood returns suggestion"""
        response = self.session.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_brief_456",
            "mood": "struggling",
            "note": "Finding it hard to focus"
        })
        assert response.status_code == 200
        data = response.json()
        assert "checkin_id" in data
        assert "message" in data
        assert "suggestion" in data  # Struggling mood should include suggestion
        print(f"Struggling check-in - Suggestion: {data.get('suggestion')}")
    
    def test_checkin_overwhelmed_mood(self):
        """Test check-in with 'overwhelmed' mood returns suggestion"""
        response = self.session.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_brief_789",
            "mood": "overwhelmed",
            "note": ""
        })
        assert response.status_code == 200
        data = response.json()
        assert "checkin_id" in data
        assert "suggestion" in data  # Overwhelmed mood should include suggestion
        print(f"Overwhelmed check-in - Suggestion: {data.get('suggestion')}")
    
    def test_get_checkins_history(self):
        """Test getting check-in history for a brief"""
        # First create a check-in
        self.session.post(f"{BASE_URL}/api/checkin", json={
            "brief_id": "test_history_brief",
            "mood": "okay",
            "note": "Test note"
        })
        
        # Then get history
        response = self.session.get(f"{BASE_URL}/api/checkins/test_history_brief")
        assert response.status_code == 200
        data = response.json()
        assert "checkins" in data
        assert isinstance(data["checkins"], list)
        print(f"Check-in history retrieved - count: {len(data['checkins'])}")


class TestRubricSimplifier:
    """Rubric Simplifier tests - new format with sections, steps, points"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, "Login failed for rubric tests"
    
    def test_rubric_simplify_returns_new_format(self):
        """Test rubric simplify returns new format with sections array"""
        rubric_text = """
        Assessment Rubric - Marketing Essay (30 marks)
        
        Criterion 1: Critical Analysis (10 marks)
        - HD (8-10): Demonstrates exceptional critical analysis with sophisticated evaluation
        - D (7-8): Shows strong critical analysis with clear evaluation
        - C (5-6): Adequate critical analysis with some evaluation
        - P (4-5): Basic critical analysis
        - F (0-3): Limited or no critical analysis
        
        Criterion 2: Research Quality (10 marks)
        - HD (8-10): Extensive use of high-quality academic sources
        - D (7-8): Good range of academic sources
        - C (5-6): Adequate sources
        - P (4-5): Limited sources
        - F (0-3): Insufficient sources
        
        Criterion 3: Writing Quality (10 marks)
        - HD (8-10): Exceptional academic writing
        - D (7-8): Strong academic writing
        - C (5-6): Adequate writing
        - P (4-5): Basic writing
        - F (0-3): Poor writing
        """
        
        response = self.session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": rubric_text
        })
        
        assert response.status_code == 200, f"Rubric simplify failed: {response.text}"
        data = response.json()
        
        # Check new format structure
        assert "sections" in data, "Response should have 'sections' array"
        assert isinstance(data["sections"], list), "sections should be an array"
        assert len(data["sections"]) > 0, "sections should not be empty"
        
        # Check section structure
        section = data["sections"][0]
        assert "name" in section, "Section should have 'name'"
        assert "steps" in section, "Section should have 'steps'"
        assert "totalPoints" in section or "points" in section, "Section should have points"
        assert "colour" in section or "color" in section, "Section should have colour"
        
        # Check steps structure
        if section.get("steps"):
            step = section["steps"][0]
            assert "title" in step or "description" in step, "Step should have title or description"
            assert "points" in step, "Step should have points"
        
        # Check for tips
        assert "tips" in section or "extraTips" in data, "Should have tips"
        
        print(f"Rubric simplify successful - {len(data['sections'])} sections returned")
        print(f"Total points: {data.get('totalPoints', 'N/A')}")


class TestNotifications:
    """Notifications endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, "Login failed for notifications tests"
    
    def test_get_notifications(self):
        """Test getting notifications returns array"""
        response = self.session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Notifications failed: {response.text}"
        data = response.json()
        
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        
        if len(data["notifications"]) > 0:
            notif = data["notifications"][0]
            assert "type" in notif
            assert "title" in notif
            assert "message" in notif
            print(f"Notifications retrieved - count: {len(data['notifications'])}")
            print(f"First notification type: {notif['type']}")
        else:
            print("No notifications found (welcome notification expected)")


class TestCreditsEndpoint:
    """Credits/Tickets endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, "Login failed for credits tests"
    
    def test_get_credit_balance(self):
        """Test getting credit balance"""
        response = self.session.get(f"{BASE_URL}/api/credits/balance")
        assert response.status_code == 200
        data = response.json()
        assert "credits" in data  # Backend still uses 'credits' internally
        print(f"Credit balance: {data['credits']}")


class TestBriefSimplifier:
    """Brief Simplifier tests - new week-by-week format"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, "Login failed for brief tests"
    
    def test_get_brief_history(self):
        """Test getting brief history"""
        response = self.session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Brief history count: {len(data)}")
        
        if len(data) > 0:
            brief = data[0]
            assert "brief_id" in brief
            assert "assessment_title" in brief
            print(f"Latest brief: {brief['assessment_title']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
