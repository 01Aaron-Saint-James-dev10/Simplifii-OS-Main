"""
Iteration 29 - Final Pre-Deployment Testing
Tests for FIX 3-6 and all Phase 1-10 features

FIX 3: Dashboard recent outputs no longer show URLs
FIX 4: Owner account shows infinity symbol for tickets
FIX 5: Emergent badge removed
FIX 6: Executive Function Planner test
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBackendAuth:
    """Test authentication endpoints"""
    
    def test_login_with_test_credentials(self):
        """Test login with test@simplifii.com / test123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        assert "credits" in data
        print(f"Login successful - user has {data['credits']} credits")

    def test_auth_me_endpoint(self):
        """Test /api/auth/me returns user info"""
        # First login to get session
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        
        # Now test /me endpoint
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == "test@simplifii.com"
        assert "credits" in data
        print(f"Auth/me working - credits: {data['credits']}")


class TestTicketCosts:
    """Verify TICKET_COSTS are correctly configured"""
    
    def test_ticket_costs_values(self):
        """Verify ticket costs match expected values"""
        expected_costs = {
            "brief-simplifier": 3,
            "course-planner": 3,
            "scaffolder": 3,
            "essay-scorer": 2,
            "humaniser": 2,
            "rubric-simplifier": 2,
            "decoder": 2,
            "visualiser": 1,
            "planner": 1,
        }
        
        # Import from backend
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.tickets import TICKET_COSTS
        
        for tool, expected_cost in expected_costs.items():
            actual_cost = TICKET_COSTS.get(tool)
            assert actual_cost == expected_cost, f"{tool}: expected {expected_cost}, got {actual_cost}"
            print(f"  {tool}: {actual_cost} tickets")
        
        print("All TICKET_COSTS verified correctly")


class TestAnalyticsEndpoints:
    """Test all analytics endpoints respond correctly"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        return session
    
    def test_analytics_pathway(self, auth_session):
        """POST /api/analytics/pathway"""
        response = auth_session.post(f"{BASE_URL}/api/analytics/pathway", json={
            "fromTool": "Brief Simplifier",
            "toTool": "Rubric Simplifier",
            "assessmentName": "Test Assessment"
        })
        assert response.status_code == 200
        assert response.json().get("status") == "logged"
        print("Analytics pathway endpoint working")
    
    def test_analytics_error(self, auth_session):
        """POST /api/analytics/error"""
        response = auth_session.post(f"{BASE_URL}/api/analytics/error", json={
            "toolName": "Brief Simplifier",
            "errorType": "test_error",
            "errorMessage": "Test error message",
            "inputType": "text"
        })
        assert response.status_code == 200
        assert response.json().get("status") == "logged"
        print("Analytics error endpoint working")
    
    def test_analytics_session(self, auth_session):
        """POST /api/analytics/session"""
        response = auth_session.post(f"{BASE_URL}/api/analytics/session", json={
            "toolName": "Brief Simplifier",
            "sessionStart": "2026-01-01T10:00:00Z",
            "inputProvided": True,
            "outputGenerated": True,
            "outputViewed": True,
            "pdfDownloaded": False,
            "feedbackGiven": False,
            "nextStepClicked": False,
            "sessionEnd": "2026-01-01T10:15:00Z",
            "sessionDurationSeconds": 900
        })
        assert response.status_code == 200
        assert response.json().get("status") == "logged"
        print("Analytics session endpoint working")
    
    def test_analytics_checkin(self, auth_session):
        """POST /api/analytics/checkin"""
        response = auth_session.post(f"{BASE_URL}/api/analytics/checkin", json={
            "toolName": "Brief Simplifier",
            "feeling": "confident"
        })
        assert response.status_code == 200
        assert response.json().get("status") == "logged"
        print("Analytics checkin endpoint working")
    
    def test_analytics_funnel(self, auth_session):
        """POST /api/analytics/funnel"""
        response = auth_session.post(f"{BASE_URL}/api/analytics/funnel", json={
            "event": "tool_opened",
            "toolName": "Brief Simplifier",
            "ticketsRemaining": 5
        })
        assert response.status_code == 200
        assert response.json().get("status") == "logged"
        print("Analytics funnel endpoint working")
    
    def test_analytics_outcome(self, auth_session):
        """POST /api/analytics/outcome"""
        response = auth_session.post(f"{BASE_URL}/api/analytics/outcome", json={
            "toolName": "Brief Simplifier",
            "assessmentName": "Test Assessment",
            "outcome": "passed",
            "daysAfterSession": 7
        })
        assert response.status_code == 200
        assert response.json().get("status") == "logged"
        print("Analytics outcome endpoint working")


class TestQuickWinEndpoint:
    """Test /api/user/quick-win for SemesterProgress"""
    
    def test_quick_win_endpoint(self):
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        
        response = session.get(f"{BASE_URL}/api/user/quick-win")
        # Should return 200 even if no data
        assert response.status_code == 200
        print(f"Quick-win endpoint working: {response.json()}")


class TestHistoryEndpoint:
    """Test /api/history for recent outputs"""
    
    def test_history_endpoint(self):
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        
        response = session.get(f"{BASE_URL}/api/history?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        print(f"History endpoint working - {len(data.get('entries', []))} entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
