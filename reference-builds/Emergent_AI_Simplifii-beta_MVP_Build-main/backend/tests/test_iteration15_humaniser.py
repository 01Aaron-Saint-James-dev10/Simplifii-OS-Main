"""
Iteration 15 - Humaniser Overhaul Tests
Tests the rebuilt Humaniser tool with neuroaffirming, strengths-based philosophy.

Features tested:
- POST /api/humanise returns all 8 required fields
- changesTable has entries with originalPhrase, humanisedVersion, reason
- aiDetectionRiskAreas has entries with pattern and explanation
- voiceReflectionQuestions has 3 questions
- Auth protection (401 without auth)
- Other endpoints still work (regression)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test text for humaniser - short academic text that triggers AI detection patterns
TEST_TEXT = "The utilisation of social media platforms has been demonstrated to have a significant impact on student mental health outcomes. Furthermore, it has been established that excessive screen time correlates with decreased academic performance."


class TestHumaniserAuth:
    """Test authentication requirements for humaniser endpoint"""
    
    def test_humanise_without_auth_returns_401(self):
        """POST /api/humanise without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/humanise without auth returns 401")


class TestHumaniserEndpoint:
    """Test the humaniser endpoint with authentication"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Login and get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print("✓ Login successful")
        return session
    
    def test_humanise_returns_all_required_fields(self, auth_session):
        """POST /api/humanise should return all 8 required fields"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120  # LLM calls can take 20-60 seconds
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check all 8 required top-level fields
        required_fields = [
            "whyThisMatters",
            "original",
            "humanised",
            "changesTable",
            "aiDetectionRiskAreas",
            "voiceReflectionQuestions",
            "academicEnquiryPrompt",
            "integrityReminder"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            print(f"  ✓ Field '{field}' present")
        
        print("✓ POST /api/humanise returns all 8 required fields")
        return data
    
    def test_humanise_whyThisMatters_is_string(self, auth_session):
        """whyThisMatters should be a non-empty string"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        assert isinstance(data.get("whyThisMatters"), str), "whyThisMatters should be a string"
        assert len(data["whyThisMatters"]) > 20, "whyThisMatters should be meaningful (>20 chars)"
        print(f"✓ whyThisMatters is a meaningful string ({len(data['whyThisMatters'])} chars)")
    
    def test_humanise_changesTable_structure(self, auth_session):
        """changesTable should have entries with originalPhrase, humanisedVersion, reason"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        changes_table = data.get("changesTable", [])
        assert isinstance(changes_table, list), "changesTable should be a list"
        assert len(changes_table) >= 4, f"changesTable should have 4-8 entries, got {len(changes_table)}"
        assert len(changes_table) <= 10, f"changesTable should have 4-8 entries, got {len(changes_table)}"
        
        # Check structure of each entry
        for i, entry in enumerate(changes_table):
            assert "originalPhrase" in entry, f"Entry {i} missing originalPhrase"
            assert "humanisedVersion" in entry, f"Entry {i} missing humanisedVersion"
            assert "reason" in entry, f"Entry {i} missing reason"
            assert isinstance(entry["originalPhrase"], str), f"Entry {i} originalPhrase should be string"
            assert isinstance(entry["humanisedVersion"], str), f"Entry {i} humanisedVersion should be string"
            assert isinstance(entry["reason"], str), f"Entry {i} reason should be string"
        
        print(f"✓ changesTable has {len(changes_table)} entries with correct structure")
    
    def test_humanise_aiDetectionRiskAreas_structure(self, auth_session):
        """aiDetectionRiskAreas should have entries with pattern and explanation"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        risk_areas = data.get("aiDetectionRiskAreas", [])
        assert isinstance(risk_areas, list), "aiDetectionRiskAreas should be a list"
        assert len(risk_areas) >= 2, f"aiDetectionRiskAreas should have 2-3 entries, got {len(risk_areas)}"
        
        # Check structure of each entry
        for i, entry in enumerate(risk_areas):
            assert "pattern" in entry, f"Entry {i} missing pattern"
            assert "explanation" in entry, f"Entry {i} missing explanation"
            assert isinstance(entry["pattern"], str), f"Entry {i} pattern should be string"
            assert isinstance(entry["explanation"], str), f"Entry {i} explanation should be string"
        
        print(f"✓ aiDetectionRiskAreas has {len(risk_areas)} entries with correct structure")
    
    def test_humanise_voiceReflectionQuestions_has_3_questions(self, auth_session):
        """voiceReflectionQuestions should have exactly 3 questions"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        questions = data.get("voiceReflectionQuestions", [])
        assert isinstance(questions, list), "voiceReflectionQuestions should be a list"
        assert len(questions) == 3, f"voiceReflectionQuestions should have exactly 3 questions, got {len(questions)}"
        
        for i, q in enumerate(questions):
            assert isinstance(q, str), f"Question {i} should be a string"
            assert len(q) > 10, f"Question {i} should be meaningful (>10 chars)"
        
        print(f"✓ voiceReflectionQuestions has exactly 3 questions")
    
    def test_humanise_academicEnquiryPrompt_is_string(self, auth_session):
        """academicEnquiryPrompt should be a non-empty string"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        prompt = data.get("academicEnquiryPrompt")
        assert isinstance(prompt, str), "academicEnquiryPrompt should be a string"
        assert len(prompt) > 20, "academicEnquiryPrompt should be meaningful (>20 chars)"
        print(f"✓ academicEnquiryPrompt is a meaningful string ({len(prompt)} chars)")
    
    def test_humanise_integrityReminder_is_string(self, auth_session):
        """integrityReminder should be a non-empty string"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        reminder = data.get("integrityReminder")
        assert isinstance(reminder, str), "integrityReminder should be a string"
        assert len(reminder) > 20, "integrityReminder should be meaningful (>20 chars)"
        print(f"✓ integrityReminder is a meaningful string ({len(reminder)} chars)")
    
    def test_humanise_original_matches_input(self, auth_session):
        """original field should match the input text"""
        response = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": TEST_TEXT},
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        data = response.json()
        
        original = data.get("original", "")
        # The original should contain the input text (may have minor formatting differences)
        assert TEST_TEXT[:50] in original or original[:50] in TEST_TEXT, "original should match input text"
        print("✓ original field matches input text")


class TestRegressionEndpoints:
    """Regression tests - ensure other endpoints still work"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Login and get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return session
    
    def test_auth_me_works(self, auth_session):
        """GET /api/auth/me should return user data"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "email" in data, "Response should contain email"
        print("✓ GET /api/auth/me works")
    
    def test_notifications_works(self, auth_session):
        """GET /api/notifications should return notifications"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/notifications works")
    
    def test_streak_works(self, auth_session):
        """GET /api/streak should return streak data"""
        response = auth_session.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "current_streak" in data, "Response should contain current_streak"
        print("✓ GET /api/streak works")
    
    def test_essay_score_without_auth_returns_401(self):
        """POST /api/essay/score without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/essay/score",
            json={"essay_text": "test", "rubric_text": "", "brief_text": ""},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/essay/score without auth returns 401")
    
    def test_scaffold_without_auth_returns_401(self):
        """POST /api/scaffold without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/scaffold",
            json={"topic": "test", "assignment_type": "essay", "word_count": 1000, "level": "undergraduate"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/scaffold without auth returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
