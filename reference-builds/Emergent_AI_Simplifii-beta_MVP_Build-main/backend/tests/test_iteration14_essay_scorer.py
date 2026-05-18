"""
Iteration 14 - Essay Scorer Overhaul Tests
Tests for POST /api/essay/score and POST /api/essay/deep-feedback endpoints
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data - short essay and rubric for faster LLM response
TEST_ESSAY = """Social media algorithms have fundamentally changed political discourse in democratic societies. 
Sunstein (2017) argues that echo chambers reinforce existing beliefs, limiting exposure to diverse viewpoints. 
This essay examines how algorithmic curation affects political polarisation, drawing on empirical studies 
from the United States and Australia. The evidence suggests that while algorithms amplify partisan content, 
user agency remains a significant factor in information consumption patterns."""

TEST_RUBRIC = """Critical Analysis (30%): Demonstrates sophisticated analysis of sources and arguments.
Research Quality (30%): Uses peer-reviewed sources with proper citations.
Argument Structure (20%): Clear thesis with logical progression.
Writing Quality (20%): Academic tone with correct grammar and spelling."""


class TestEssayScorerAuth:
    """Test authentication requirements for essay scorer endpoints"""
    
    def test_essay_score_without_auth_returns_401(self):
        """POST /api/essay/score without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/essay/score",
            json={"essay_text": TEST_ESSAY, "rubric_text": TEST_RUBRIC},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/essay/score without auth returns 401")
    
    def test_essay_deep_feedback_without_auth_returns_401(self):
        """POST /api/essay/deep-feedback without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/essay/deep-feedback",
            json={
                "essay_text": TEST_ESSAY,
                "rubric_text": TEST_RUBRIC,
                "initial_scores": "[]"
            },
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/essay/deep-feedback without auth returns 401")


class TestEssayScorerEndpoint:
    """Test POST /api/essay/score endpoint with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            timeout=10
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        print(f"✓ Logged in successfully")
    
    def test_essay_score_with_rubric_mode1(self):
        """POST /api/essay/score with essay + rubric returns Mode 1 scoring"""
        response = self.session.post(
            f"{BASE_URL}/api/essay/score",
            json={
                "essay_text": TEST_ESSAY,
                "rubric_text": TEST_RUBRIC,
                "brief_text": ""
            },
            timeout=90  # LLM calls can take 20-60 seconds
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        assert "overallScore" in data, "Missing overallScore"
        assert "assessmentType" in data, "Missing assessmentType"
        assert "scoringMode" in data, "Missing scoringMode"
        assert "scoreBreakdown" in data, "Missing scoreBreakdown"
        assert "overallImpression" in data, "Missing overallImpression"
        assert "optInPrompt" in data, "Missing optInPrompt"
        
        # Verify overallScore is a number
        assert isinstance(data["overallScore"], (int, float)), "overallScore should be a number"
        assert 0 <= data["overallScore"] <= 100, "overallScore should be 0-100"
        
        # Verify scoringMode indicates Mode 1
        assert "1" in data["scoringMode"] or "Rubric" in data["scoringMode"], f"Expected Mode 1, got {data['scoringMode']}"
        
        # Verify scoreBreakdown has strengths
        assert len(data["scoreBreakdown"]) > 0, "scoreBreakdown should not be empty"
        for criterion in data["scoreBreakdown"]:
            assert "criterion" in criterion, "Missing criterion name"
            assert "yourScore" in criterion, "Missing yourScore"
            assert "maximum" in criterion, "Missing maximum"
            assert "percentage" in criterion, "Missing percentage"
            assert "strengths" in criterion, "Missing strengths array"
            assert isinstance(criterion["strengths"], list), "strengths should be a list"
            assert len(criterion["strengths"]) >= 1, "Should have at least 1 strength per criterion"
        
        print(f"✓ POST /api/essay/score with rubric returns Mode 1 scoring")
        print(f"  - Overall Score: {data['overallScore']}%")
        print(f"  - Assessment Type: {data['assessmentType']}")
        print(f"  - Scoring Mode: {data['scoringMode']}")
        print(f"  - Criteria count: {len(data['scoreBreakdown'])}")
        
        # Store for deep feedback test
        self.initial_scores = data["scoreBreakdown"]
        return data
    
    def test_essay_score_without_rubric_mode3(self):
        """POST /api/essay/score with essay only returns Mode 3 scoring"""
        response = self.session.post(
            f"{BASE_URL}/api/essay/score",
            json={
                "essay_text": TEST_ESSAY,
                "rubric_text": "",
                "brief_text": ""
            },
            timeout=90
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        assert "overallScore" in data, "Missing overallScore"
        assert "scoringMode" in data, "Missing scoringMode"
        assert "scoreBreakdown" in data, "Missing scoreBreakdown"
        
        # Verify scoringMode indicates Mode 3 (essay only)
        assert "3" in data["scoringMode"] or "Essay" in data["scoringMode"] or "only" in data["scoringMode"].lower(), \
            f"Expected Mode 3, got {data['scoringMode']}"
        
        print(f"✓ POST /api/essay/score without rubric returns Mode 3 scoring")
        print(f"  - Scoring Mode: {data['scoringMode']}")
        return data


class TestEssayDeepFeedbackEndpoint:
    """Test POST /api/essay/deep-feedback endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get initial scores first"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            timeout=10
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        # Get initial scores from essay/score endpoint
        score_response = self.session.post(
            f"{BASE_URL}/api/essay/score",
            json={
                "essay_text": TEST_ESSAY,
                "rubric_text": TEST_RUBRIC,
                "brief_text": ""
            },
            timeout=90
        )
        if score_response.status_code != 200:
            pytest.skip("Could not get initial scores - skipping deep feedback test")
        
        self.initial_scores = score_response.json().get("scoreBreakdown", [])
        print(f"✓ Got initial scores for deep feedback test")
    
    def test_essay_deep_feedback_returns_detailed_feedback(self):
        """POST /api/essay/deep-feedback returns criterionFeedback, gapAnalysis, connectToTheBiggerPicture"""
        response = self.session.post(
            f"{BASE_URL}/api/essay/deep-feedback",
            json={
                "essay_text": TEST_ESSAY,
                "rubric_text": TEST_RUBRIC,
                "brief_text": "",
                "initial_scores": json.dumps(self.initial_scores)
            },
            timeout=90
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        assert "criterionFeedback" in data, "Missing criterionFeedback"
        assert "gapAnalysis" in data, "Missing gapAnalysis"
        assert "connectToTheBiggerPicture" in data, "Missing connectToTheBiggerPicture"
        
        # Verify criterionFeedback structure
        assert isinstance(data["criterionFeedback"], list), "criterionFeedback should be a list"
        assert len(data["criterionFeedback"]) > 0, "criterionFeedback should not be empty"
        
        for criterion in data["criterionFeedback"]:
            assert "criterion" in criterion, "Missing criterion name"
            assert "socraticQuestions" in criterion, "Missing socraticQuestions"
            assert isinstance(criterion["socraticQuestions"], list), "socraticQuestions should be a list"
            assert len(criterion["socraticQuestions"]) >= 1, "Should have at least 1 Socratic question"
        
        # Verify gapAnalysis
        assert isinstance(data["gapAnalysis"], list), "gapAnalysis should be a list"
        
        # Verify connectToTheBiggerPicture
        assert isinstance(data["connectToTheBiggerPicture"], str), "connectToTheBiggerPicture should be a string"
        assert len(data["connectToTheBiggerPicture"]) > 0, "connectToTheBiggerPicture should not be empty"
        
        print(f"✓ POST /api/essay/deep-feedback returns detailed feedback")
        print(f"  - Criterion feedback count: {len(data['criterionFeedback'])}")
        print(f"  - Gap analysis items: {len(data['gapAnalysis'])}")
        print(f"  - Bigger picture question present: Yes")
        
        return data


class TestRegressionEndpoints:
    """Regression tests for other endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"},
            timeout=10
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping regression tests")
    
    def test_auth_me_works(self):
        """GET /api/auth/me returns user data"""
        response = self.session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "email" in data, "Missing email"
        assert data["email"] == "test@simplifii.com"
        print("✓ GET /api/auth/me works")
    
    def test_notifications_works(self):
        """GET /api/notifications works"""
        response = self.session.get(f"{BASE_URL}/api/notifications", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/notifications works")
    
    def test_streak_works(self):
        """GET /api/streak works"""
        response = self.session.get(f"{BASE_URL}/api/streak", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "current_streak" in data, "Missing current_streak"
        print("✓ GET /api/streak works")
    
    def test_briefs_history_works(self):
        """GET /api/briefs/history works"""
        response = self.session.get(f"{BASE_URL}/api/briefs/history", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/briefs/history works")
    
    def test_university_intel_works(self):
        """GET /api/university/intel works"""
        response = self.session.get(f"{BASE_URL}/api/university/intel", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/university/intel works")
    
    def test_activity_feed_works(self):
        """GET /api/activity/feed works (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/activity/feed", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/activity/feed works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
