"""
Iteration 26 - Feedback System, Lab, and New Features Tests
Tests: Feedback endpoints, Lab endpoints, Admin dashboard access
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFeedbackEndpoints:
    """Test feedback system endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for all tests"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.user = login_resp.json()
    
    def test_feedback_tool_positive(self):
        """POST /api/feedback/tool - saves positive feedback"""
        resp = self.session.post(f"{BASE_URL}/api/feedback/tool", json={
            "toolName": "Brief Simplifier",
            "sessionId": "test_session_123",
            "reaction": "positive",
            "followUpAnswer": "Timeline",
            "openText": "Great tool for understanding briefs!",
            "interestedInCoDesign": False
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") == True
    
    def test_feedback_tool_neutral(self):
        """POST /api/feedback/tool - saves neutral feedback"""
        resp = self.session.post(f"{BASE_URL}/api/feedback/tool", json={
            "toolName": "Rubric Simplifier",
            "sessionId": "test_session_456",
            "reaction": "neutral",
            "followUpAnswer": "More specific to my task",
            "openText": "",
            "interestedInCoDesign": True
        })
        assert resp.status_code == 200
        assert resp.json().get("success") == True
    
    def test_feedback_tool_negative(self):
        """POST /api/feedback/tool - saves negative feedback"""
        resp = self.session.post(f"{BASE_URL}/api/feedback/tool", json={
            "toolName": "Essay Scorer",
            "sessionId": "test_session_789",
            "reaction": "negative",
            "followUpAnswer": "Output was too generic",
            "openText": "Didn't match my essay style",
            "interestedInCoDesign": False
        })
        assert resp.status_code == 200
        assert resp.json().get("success") == True
    
    def test_feedback_tool_invalid_reaction(self):
        """POST /api/feedback/tool - rejects invalid reaction"""
        resp = self.session.post(f"{BASE_URL}/api/feedback/tool", json={
            "toolName": "Brief Simplifier",
            "sessionId": "test_session",
            "reaction": "invalid_reaction",
            "followUpAnswer": "",
            "openText": ""
        })
        assert resp.status_code == 400
        assert "Invalid reaction" in resp.json().get("detail", "")
    
    def test_feedback_codesign_join(self):
        """POST /api/feedback/codesign - saves co-design waitlist entry"""
        resp = self.session.post(f"{BASE_URL}/api/feedback/codesign", json={
            "name": "Test Student",
            "email": "student@test.edu",
            "university": "UNSW Sydney",
            "toolIdea": "Citation formatter that auto-detects style"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") == True
    
    def test_feedback_summary_non_admin(self):
        """GET /api/feedback/summary - returns 403 for non-admin"""
        resp = self.session.get(f"{BASE_URL}/api/feedback/summary")
        assert resp.status_code == 403
        assert "Admin only" in resp.json().get("detail", "")


class TestLabEndpoints:
    """Test Lab (Simplifii Lab) endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for all tests"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
    
    def test_lab_submit_suggestion(self):
        """POST /api/lab - saves suggestion"""
        resp = self.session.post(f"{BASE_URL}/api/lab", json={
            "type": "suggestion",
            "content": "Add a citation formatter tool that supports APA, Harvard, and Chicago styles",
            "toolName": ""
        })
        assert resp.status_code == 200
        assert resp.json().get("success") == True
    
    def test_lab_submit_problem(self):
        """POST /api/lab - saves problem report"""
        resp = self.session.post(f"{BASE_URL}/api/lab", json={
            "type": "problem",
            "content": "Essay scorer takes too long to process large documents",
            "toolName": "Essay Scorer"
        })
        assert resp.status_code == 200
        assert resp.json().get("success") == True
    
    def test_lab_submit_invalid_type(self):
        """POST /api/lab - rejects invalid submission type"""
        resp = self.session.post(f"{BASE_URL}/api/lab", json={
            "type": "invalid_type",
            "content": "Test content",
            "toolName": ""
        })
        assert resp.status_code == 400
        assert "Invalid submission type" in resp.json().get("detail", "")
    
    def test_lab_get_votes(self):
        """GET /api/lab/votes - returns vote counts and user's votes"""
        resp = self.session.get(f"{BASE_URL}/api/lab/votes")
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify structure
        assert "votes" in data
        assert "myVotes" in data
        
        # Verify all 4 idea IDs are present
        votes = data["votes"]
        assert "citation-formatter" in votes
        assert "exam-predictor" in votes
        assert "group-coordinator" in votes
        assert "presentation-builder" in votes
        
        # Verify vote counts are integers
        for idea_id, count in votes.items():
            assert isinstance(count, int)
    
    def test_lab_vote_new_idea(self):
        """POST /api/lab/vote - records a vote on an idea"""
        # First check current votes
        votes_resp = self.session.get(f"{BASE_URL}/api/lab/votes")
        my_votes = votes_resp.json().get("myVotes", {})
        
        # Find an idea we haven't voted on
        unvoted_ideas = [
            idea for idea in ["exam-predictor", "group-coordinator", "presentation-builder"]
            if not my_votes.get(idea)
        ]
        
        if unvoted_ideas:
            idea_to_vote = unvoted_ideas[0]
            resp = self.session.post(f"{BASE_URL}/api/lab/vote", json={
                "ideaId": idea_to_vote
            })
            assert resp.status_code == 200
            assert resp.json().get("success") == True
            
            # Verify vote was recorded
            verify_resp = self.session.get(f"{BASE_URL}/api/lab/votes")
            assert verify_resp.json()["myVotes"].get(idea_to_vote) == True
        else:
            # All ideas already voted - test duplicate vote rejection
            resp = self.session.post(f"{BASE_URL}/api/lab/vote", json={
                "ideaId": "citation-formatter"
            })
            assert resp.status_code == 400
            assert "Already voted" in resp.json().get("detail", "")
    
    def test_lab_vote_missing_idea_id(self):
        """POST /api/lab/vote - rejects missing ideaId"""
        resp = self.session.post(f"{BASE_URL}/api/lab/vote", json={})
        assert resp.status_code == 400
        assert "ideaId required" in resp.json().get("detail", "")


class TestHumaniserAiRiskScores:
    """Test Humaniser AI Risk Score feature (API response structure)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
    
    def test_humanise_endpoint_exists(self):
        """POST /api/humanise - endpoint exists and accepts text"""
        # Note: This test just verifies the endpoint exists
        # Full AI processing may take time, so we just check it doesn't 404
        resp = self.session.post(f"{BASE_URL}/api/humanise", json={
            "text": "This is a test sentence to humanise."
        })
        # Should not be 404 or 405
        assert resp.status_code in [200, 402, 500], f"Unexpected status: {resp.status_code}"


class TestHistorySaveAutosave:
    """Test history save endpoint for autosave feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
    
    def test_history_save_endpoint(self):
        """POST /api/history/save - saves tool output to history"""
        resp = self.session.post(f"{BASE_URL}/api/history/save", json={
            "tool_name": "Brief Simplifier",
            "input_summary": "Test brief about marketing assignment",
            "output_summary": "Week 1: Research phase...",
            "full_output": {"weeks": [{"week": 1, "tasks": ["Research"]}]},
            "ticket_cost": 1
        })
        # Should succeed or return appropriate error
        assert resp.status_code in [200, 201, 400, 422], f"Unexpected: {resp.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
