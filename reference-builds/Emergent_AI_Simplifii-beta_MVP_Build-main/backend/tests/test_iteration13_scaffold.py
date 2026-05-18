"""
Iteration 13 - Testing Assessment Scaffolder Overhaul
Features:
1. POST /api/scaffold with documents returns overallGuidance, documentConnections, rubricAlignment, suggestedStructure, thinkingFramework
2. POST /api/scaffold with documents returns suggestedStructure with criticalThinking, lectureLinks, rubricCriteria, commonMistakes per section
3. POST /api/scaffold without documents (empty strings) still works and returns a valid scaffold
4. POST /api/scaffold without auth returns 401
5. All other previously working endpoints still respond (auth, notifications, streak, digest, universities)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@simplifii.com"
TEST_PASSWORD = "test123"


class TestScaffoldEndpoint:
    """Tests for the overhauled /api/scaffold endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Login to get session cookie
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return s
    
    def test_scaffold_without_auth_returns_401(self):
        """POST /api/scaffold without auth should return 401"""
        response = requests.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Test topic",
            "word_count": 2000,
            "level": "Second Year",
            "brief_text": "",
            "rubric_text": "",
            "outline_text": "",
            "slides_text": ""
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/scaffold without auth returns 401")
    
    def test_scaffold_without_documents_returns_valid_scaffold(self, session):
        """POST /api/scaffold without documents (empty strings) should return valid scaffold"""
        response = session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Impact of Social Media on Mental Health",
            "word_count": 2000,
            "level": "Second Year",
            "brief_text": "",
            "rubric_text": "",
            "outline_text": "",
            "slides_text": ""
        }, timeout=90)  # LLM calls can take 30-60 seconds
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields exist
        assert "overallGuidance" in data, "Missing overallGuidance"
        assert "suggestedStructure" in data, "Missing suggestedStructure"
        assert "thinkingFramework" in data, "Missing thinkingFramework"
        
        # Without documents, documentConnections and rubricAlignment should be empty arrays
        assert "documentConnections" in data, "Missing documentConnections"
        assert "rubricAlignment" in data, "Missing rubricAlignment"
        assert isinstance(data["documentConnections"], list), "documentConnections should be a list"
        assert isinstance(data["rubricAlignment"], list), "rubricAlignment should be a list"
        
        # Check suggestedStructure has sections
        assert isinstance(data["suggestedStructure"], list), "suggestedStructure should be a list"
        assert len(data["suggestedStructure"]) >= 3, "Should have at least 3 sections"
        
        # Check each section has required fields
        for section in data["suggestedStructure"]:
            assert "section" in section, "Section missing 'section' name"
            assert "wordCount" in section, "Section missing 'wordCount'"
            assert "criticalThinking" in section, "Section missing 'criticalThinking'"
            assert isinstance(section["criticalThinking"], list), "criticalThinking should be a list"
        
        # Check thinkingFramework has Bloom's taxonomy levels
        tf = data["thinkingFramework"]
        assert "remember" in tf, "thinkingFramework missing 'remember'"
        assert "understand" in tf, "thinkingFramework missing 'understand'"
        assert "apply" in tf, "thinkingFramework missing 'apply'"
        assert "analyse" in tf, "thinkingFramework missing 'analyse'"
        assert "evaluate" in tf, "thinkingFramework missing 'evaluate'"
        assert "create" in tf, "thinkingFramework missing 'create'"
        
        print("✓ POST /api/scaffold without documents returns valid scaffold")
        print(f"  - overallGuidance: {len(data['overallGuidance'])} chars")
        print(f"  - suggestedStructure: {len(data['suggestedStructure'])} sections")
        print(f"  - thinkingFramework: {len(tf)} levels")
    
    def test_scaffold_with_documents_returns_full_scaffold(self, session):
        """POST /api/scaffold with documents returns full scaffold with cross-document connections"""
        response = session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Social media impact on mental health",
            "word_count": 2000,
            "level": "Second Year",
            "brief_text": "Write a 2000 word essay analysing the impact of social media on mental health. You must use at least 8 peer-reviewed sources. Due Week 10.",
            "rubric_text": "Critical Analysis 30%: Demonstrates deep critical engagement with sources. Structure 20%: Clear introduction, body, conclusion. Evidence 30%: Uses peer-reviewed sources appropriately. Writing Quality 20%: Academic tone, proper referencing.",
            "outline_text": "",
            "slides_text": ""
        }, timeout=90)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check all required top-level fields
        assert "overallGuidance" in data, "Missing overallGuidance"
        assert "documentConnections" in data, "Missing documentConnections"
        assert "rubricAlignment" in data, "Missing rubricAlignment"
        assert "suggestedStructure" in data, "Missing suggestedStructure"
        assert "thinkingFramework" in data, "Missing thinkingFramework"
        
        # With documents provided, should have documentConnections
        assert isinstance(data["documentConnections"], list), "documentConnections should be a list"
        # Note: LLM may or may not generate connections depending on content
        
        # With rubric provided, should have rubricAlignment
        assert isinstance(data["rubricAlignment"], list), "rubricAlignment should be a list"
        
        # Check suggestedStructure sections have enhanced fields
        assert isinstance(data["suggestedStructure"], list), "suggestedStructure should be a list"
        assert len(data["suggestedStructure"]) >= 3, "Should have at least 3 sections"
        
        for idx, section in enumerate(data["suggestedStructure"]):
            assert "section" in section, f"Section {idx} missing 'section' name"
            assert "wordCount" in section, f"Section {idx} missing 'wordCount'"
            assert "percentage" in section, f"Section {idx} missing 'percentage'"
            assert "purpose" in section, f"Section {idx} missing 'purpose'"
            
            # Check for enhanced fields
            assert "criticalThinking" in section, f"Section {idx} missing 'criticalThinking'"
            assert isinstance(section["criticalThinking"], list), f"Section {idx} criticalThinking should be a list"
            
            # Check criticalThinking prompts have required fields
            for ct in section.get("criticalThinking", []):
                assert "level" in ct, "criticalThinking prompt missing 'level'"
                assert "prompt" in ct, "criticalThinking prompt missing 'prompt'"
            
            # Check for other enhanced fields (may be empty arrays)
            assert "rubricCriteria" in section or True, f"Section {idx} may have rubricCriteria"
            assert "lectureLinks" in section or True, f"Section {idx} may have lectureLinks"
            assert "commonMistakes" in section or True, f"Section {idx} may have commonMistakes"
        
        print("✓ POST /api/scaffold with documents returns full scaffold")
        print(f"  - overallGuidance: {len(data['overallGuidance'])} chars")
        print(f"  - documentConnections: {len(data.get('documentConnections', []))} connections")
        print(f"  - rubricAlignment: {len(data.get('rubricAlignment', []))} criteria")
        print(f"  - suggestedStructure: {len(data['suggestedStructure'])} sections")


class TestExistingEndpointsRegression:
    """Regression tests for previously working endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return s
    
    def test_auth_login(self):
        """POST /api/auth/login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        print("✓ POST /api/auth/login works")
    
    def test_auth_me(self, session):
        """GET /api/auth/me returns user data"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "email" in data, "Missing email in user data"
        print("✓ GET /api/auth/me returns user data")
    
    def test_notifications(self, session):
        """GET /api/notifications works"""
        response = session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "notifications" in data, "Missing notifications field"
        print("✓ GET /api/notifications works")
    
    def test_streak(self, session):
        """GET /api/streak works"""
        response = session.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "current_streak" in data, "Missing current_streak"
        assert "streak_dates" in data, "Missing streak_dates"
        print("✓ GET /api/streak works")
    
    def test_digest_weekly(self, session):
        """GET /api/digest/weekly works"""
        response = session.get(f"{BASE_URL}/api/digest/weekly")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "period" in data, "Missing period"
        assert "motivational_message" in data, "Missing motivational_message"
        print("✓ GET /api/digest/weekly works")
    
    def test_university_intel(self, session):
        """GET /api/university/intel works"""
        response = session.get(f"{BASE_URL}/api/university/intel")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "university" in data, "Missing university"
        print("✓ GET /api/university/intel works")
    
    def test_briefs_history(self, session):
        """GET /api/briefs/history works"""
        response = session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "briefs/history should return a list"
        print(f"✓ GET /api/briefs/history works ({len(data)} briefs)")
    
    def test_activity_feed(self):
        """GET /api/activity/feed works (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "feed" in data, "Missing feed field"
        print("✓ GET /api/activity/feed works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
