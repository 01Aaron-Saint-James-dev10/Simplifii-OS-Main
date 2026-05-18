"""
Iteration 31 - Promo Code Feature Tests
Tests:
1. POST /api/promo/create returns 403 for non-owner (test@simplifii.com)
2. POST /api/promo/redeem returns 404 for invalid code
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPromoEndpoints:
    """Promo code endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with non-owner credentials"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as non-owner test user
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
    def test_promo_create_returns_403_for_non_owner(self):
        """POST /api/promo/create should return 403 for non-owner user"""
        response = self.session.post(
            f"{BASE_URL}/api/promo/create",
            json={
                "code": "TEST_PROMO_CODE",
                "tickets": 5,
                "max_uses": 10,
                "expiry": None
            }
        )
        
        # Non-owner should get 403 Forbidden
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        
        # Verify error message
        data = response.json()
        assert "detail" in data
        assert "owner" in data["detail"].lower(), f"Expected 'owner' in error message, got: {data['detail']}"
        
    def test_promo_redeem_returns_404_for_invalid_code(self):
        """POST /api/promo/redeem should return 404 for invalid/non-existent code"""
        response = self.session.post(
            f"{BASE_URL}/api/promo/redeem",
            json={"code": "INVALID_NONEXISTENT_CODE_12345"}
        )
        
        # Invalid code should get 404 Not Found
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        # Verify error message
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower(), \
            f"Expected 'invalid' or 'expired' in error message, got: {data['detail']}"
            
    def test_promo_redeem_returns_400_for_empty_code(self):
        """POST /api/promo/redeem should return 400 for empty code"""
        response = self.session.post(
            f"{BASE_URL}/api/promo/redeem",
            json={"code": ""}
        )
        
        # Empty code should get 400 Bad Request
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"


class TestCreditsBalance:
    """Credits balance endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as non-owner test user
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
    def test_credits_balance_returns_is_owner_false_for_non_owner(self):
        """GET /api/credits/balance should return is_owner=false for non-owner"""
        response = self.session.get(f"{BASE_URL}/api/credits/balance")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "is_owner" in data, "Response should include is_owner field"
        assert data["is_owner"] == False, f"Expected is_owner=False for test user, got: {data['is_owner']}"
        assert "tickets" in data, "Response should include tickets field"
