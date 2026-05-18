"""
Iteration 5 Tests: Multi-Document Upload & Smart Notifications
Tests:
- /api/pdf/extract-text endpoint (multi-file support)
- /api/notifications endpoint (authenticated user notifications)
- Login flow with test credentials
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests for session-based auth"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session with cookies"""
        return requests.Session()
    
    def test_login_success(self, session):
        """Test login with test credentials returns user data and sets session cookie"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Response missing user_id"
        assert "email" in data, "Response missing email"
        assert data["email"] == "test@simplifii.com"
        assert "credits" in data, "Response missing credits"
        assert "name" in data, "Response missing name"
        
        # Check session cookie was set
        assert "session_token" in session.cookies, "Session cookie not set"
        print(f"Login successful: {data['name']} with {data['credits']} credits")
    
    def test_auth_me_returns_user(self, session):
        """Test /api/auth/me returns current user data"""
        # First login
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Auth me failed: {response.text}"
        
        data = response.json()
        assert data["email"] == "test@simplifii.com"
        print(f"Auth me successful: {data['name']}")


class TestPdfExtraction:
    """Tests for /api/pdf/extract-text endpoint - multi-file support"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for PDF tests"
        return session
    
    def test_pdf_extract_endpoint_exists(self, auth_session):
        """Test that /api/pdf/extract-text endpoint exists and accepts POST"""
        # Create a minimal PDF-like content (endpoint should handle gracefully)
        files = [
            ('files', ('test.pdf', b'%PDF-1.4 test content', 'application/pdf'))
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/pdf/extract-text", files=files)
        
        # Should return 200 even if extraction yields empty text
        assert response.status_code == 200, f"PDF extract endpoint failed: {response.text}"
        
        data = response.json()
        assert "text" in data, "Response missing 'text' field"
        print(f"PDF extract endpoint works, returned text length: {len(data['text'])}")
    
    def test_pdf_extract_multiple_files(self, auth_session):
        """Test that endpoint accepts multiple files"""
        # Create multiple minimal PDF files
        files = [
            ('files', ('test1.pdf', b'%PDF-1.4 first document content', 'application/pdf')),
            ('files', ('test2.pdf', b'%PDF-1.4 second document content', 'application/pdf')),
            ('files', ('test3.pdf', b'%PDF-1.4 third document content', 'application/pdf'))
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/pdf/extract-text", files=files)
        
        assert response.status_code == 200, f"Multi-file PDF extract failed: {response.text}"
        
        data = response.json()
        assert "text" in data
        print(f"Multi-file PDF extract works, returned text length: {len(data['text'])}")
    
    def test_pdf_extract_up_to_10_files(self, auth_session):
        """Test that endpoint handles up to 10 files (maxFiles limit)"""
        # Create 10 minimal PDF files
        files = [
            ('files', (f'test{i}.pdf', f'%PDF-1.4 document {i} content'.encode(), 'application/pdf'))
            for i in range(10)
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/pdf/extract-text", files=files)
        
        assert response.status_code == 200, f"10-file PDF extract failed: {response.text}"
        
        data = response.json()
        assert "text" in data
        print(f"10-file PDF extract works, returned text length: {len(data['text'])}")


class TestNotifications:
    """Tests for /api/notifications endpoint - Smart Notifications"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for notifications tests"
        return session
    
    def test_notifications_endpoint_exists(self, auth_session):
        """Test that /api/notifications endpoint exists and returns notifications array"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        
        assert response.status_code == 200, f"Notifications endpoint failed: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response missing 'notifications' field"
        assert isinstance(data["notifications"], list), "Notifications should be a list"
        print(f"Notifications endpoint works, returned {len(data['notifications'])} notifications")
    
    def test_notifications_have_required_fields(self, auth_session):
        """Test that each notification has required fields"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        
        assert response.status_code == 200
        
        data = response.json()
        notifications = data["notifications"]
        
        # Should have at least 1 notification (welcome or brief-based)
        assert len(notifications) >= 1, "Should have at least 1 notification"
        
        # Check first notification has required fields
        notif = notifications[0]
        required_fields = ["type", "title", "message"]
        for field in required_fields:
            assert field in notif, f"Notification missing '{field}' field"
        
        # Type should be one of the valid types
        valid_types = ["nudge", "encouragement", "celebration", "complete", "welcome"]
        assert notif["type"] in valid_types, f"Invalid notification type: {notif['type']}"
        
        print(f"First notification: type={notif['type']}, title={notif['title']}")
    
    def test_notifications_require_auth(self):
        """Test that notifications endpoint requires authentication"""
        session = requests.Session()  # No login
        response = session.get(f"{BASE_URL}/api/notifications")
        
        assert response.status_code == 401, "Notifications should require auth"
        print("Notifications correctly requires authentication")


class TestBriefsMetadataExtraction:
    """Tests for /api/briefs/extract-metadata endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for metadata tests"
        return session
    
    def test_metadata_extraction_endpoint_exists(self, auth_session):
        """Test that /api/briefs/extract-metadata endpoint exists"""
        files = [
            ('files', ('brief.pdf', b'%PDF-1.4 Assessment Brief: Marketing Essay', 'application/pdf'))
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/briefs/extract-metadata", files=files)
        
        assert response.status_code == 200, f"Metadata extraction failed: {response.text}"
        
        data = response.json()
        # Should return metadata fields (may be empty if PDF parsing fails)
        assert "assessment_title" in data or "assessment_type" in data, "Response should have metadata fields"
        print(f"Metadata extraction works: {data}")


class TestToolEndpoints:
    """Tests for tool-specific endpoints that use PDF upload"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, "Login failed for tool tests"
        return session
    
    def test_rubric_simplify_endpoint(self, auth_session):
        """Test /api/rubric/simplify endpoint exists"""
        response = auth_session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": "Criterion 1: Critical Analysis (25%) - HD: Demonstrates exceptional critical thinking"
        })
        
        # Should return 200 or 500 (if LLM fails), not 404
        assert response.status_code in [200, 500], f"Rubric simplify endpoint issue: {response.status_code}"
        print(f"Rubric simplify endpoint status: {response.status_code}")
    
    def test_essay_score_endpoint(self, auth_session):
        """Test /api/essay/score endpoint exists"""
        response = auth_session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": "This is a test essay about marketing strategies.",
            "rubric_text": "Criterion 1: Critical Analysis (25%)"
        })
        
        assert response.status_code in [200, 500], f"Essay score endpoint issue: {response.status_code}"
        print(f"Essay score endpoint status: {response.status_code}")
    
    def test_humanise_endpoint(self, auth_session):
        """Test /api/humanise endpoint exists"""
        response = auth_session.post(f"{BASE_URL}/api/humanise", json={
            "text": "The utilization of artificial intelligence in educational contexts has demonstrated significant potential."
        })
        
        assert response.status_code in [200, 500], f"Humanise endpoint issue: {response.status_code}"
        print(f"Humanise endpoint status: {response.status_code}")
    
    def test_scaffold_endpoint(self, auth_session):
        """Test /api/scaffold endpoint exists"""
        response = auth_session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Marketing Strategy",
            "word_count": 2000,
            "level": "Second Year"
        })
        
        assert response.status_code in [200, 500], f"Scaffold endpoint issue: {response.status_code}"
        print(f"Scaffold endpoint status: {response.status_code}")
    
    def test_decode_jargon_endpoint(self, auth_session):
        """Test /api/decode-jargon endpoint exists"""
        response = auth_session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": "Students must demonstrate critical engagement with the literature and synthesise key arguments."
        })
        
        assert response.status_code in [200, 500], f"Decode jargon endpoint issue: {response.status_code}"
        print(f"Decode jargon endpoint status: {response.status_code}")
    
    def test_course_planner_upload_endpoint(self, auth_session):
        """Test /api/course-planner/upload endpoint accepts multiple files"""
        files = [
            ('files', ('brief1.pdf', b'%PDF-1.4 Assessment 1: Essay Due Week 5', 'application/pdf')),
            ('files', ('brief2.pdf', b'%PDF-1.4 Assessment 2: Report Due Week 10', 'application/pdf'))
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/course-planner/upload", files=files)
        
        assert response.status_code in [200, 500], f"Course planner upload issue: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "briefs" in data, "Response should have 'briefs' field"
            assert "count" in data, "Response should have 'count' field"
            print(f"Course planner upload works: {data['count']} briefs processed")
        else:
            print(f"Course planner upload returned 500 (LLM processing)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
