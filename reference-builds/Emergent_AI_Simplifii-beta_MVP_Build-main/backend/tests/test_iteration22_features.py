"""
Iteration 22 Tests - Testing 6 specific fixes plus Concept Visualiser enhancement:
1. Owner Testing Mode (owner badge for aaron@simplifii.com.au)
2. Single Ticket Purchases ($1.99, $3.49, $4.99)
3. Humaniser System Prompt upgrade (already done)
4. AI Disclaimer on all tool outputs
5. Landing page and meta description copy updates
6. Collapsible Accuracy Notice on Humaniser tool
PLUS: Concept Visualiser Feynman technique enhancement
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://udl-magic.preview.emergentagent.com')


class TestBackendHealth:
    """Basic backend health checks"""
    
    def test_backend_responds(self):
        """Backend should respond to requests"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        # Should return 401 (not authenticated) not 500
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✓ Backend is responding correctly")


class TestSingleTicketPacks:
    """Fix 2: Single ticket pack endpoints exist"""
    
    def test_single_1_pack_exists(self):
        """single-1 pack (1 ticket, $1.99) should be purchasable"""
        # We can't complete purchase without auth, but we can verify the endpoint exists
        response = requests.post(f"{BASE_URL}/api/credits/purchase", data={
            "package_id": "single-1",
            "origin_url": "https://udl-magic.preview.emergentagent.com"
        })
        # Should return 401 (not authenticated) not 404 (endpoint not found)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ single-1 pack endpoint exists")
    
    def test_single_2_pack_exists(self):
        """single-2 pack (2 tickets, $3.49) should be purchasable"""
        response = requests.post(f"{BASE_URL}/api/credits/purchase", data={
            "package_id": "single-2",
            "origin_url": "https://udl-magic.preview.emergentagent.com"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ single-2 pack endpoint exists")
    
    def test_single_3_pack_exists(self):
        """single-3 pack (3 tickets, $4.99) should be purchasable"""
        response = requests.post(f"{BASE_URL}/api/credits/purchase", data={
            "package_id": "single-3",
            "origin_url": "https://udl-magic.preview.emergentagent.com"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ single-3 pack endpoint exists")


class TestOwnerBadgeBackend:
    """Fix 1: Owner badge - backend returns is_owner flag"""
    
    def test_auth_me_returns_is_owner_field(self):
        """The /api/auth/me endpoint should return is_owner field when authenticated"""
        # We need to login first to test this
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            # Now check /api/auth/me
            me_response = session.get(f"{BASE_URL}/api/auth/me")
            assert me_response.status_code == 200
            data = me_response.json()
            # is_owner should be present and False for test user
            assert "is_owner" in data, "is_owner field missing from /api/auth/me response"
            assert data["is_owner"] == False, "test@simplifii.com should not be owner"
            print(f"✓ is_owner field present in /api/auth/me response (value: {data['is_owner']})")
        else:
            pytest.skip("Could not login with test credentials")


class TestConceptVisualiserEndpoint:
    """Concept Visualiser Feynman technique enhancement"""
    
    def test_concept_visualise_endpoint_exists(self):
        """POST /api/concept/visualise should exist"""
        response = requests.post(f"{BASE_URL}/api/concept/visualise", json={
            "concept": "test",
            "simple_mode": False
        })
        # Should return 401 (not authenticated) not 404
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/concept/visualise endpoint exists")


class TestMetaDescription:
    """Fix 5: Landing page meta description update"""
    
    def test_meta_description_updated(self):
        """Meta description should contain neurodivergent students text"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        html = response.text
        
        # Check for the updated meta description
        expected_text = "Designed for neurodivergent students"
        assert expected_text in html, f"Meta description should contain '{expected_text}'"
        print("✓ Meta description contains neurodivergent students text")


class TestTicketPacksConfiguration:
    """Verify ticket pack configuration in backend"""
    
    def test_ticket_packs_defined(self):
        """Verify TICKET_PACKS includes single packs"""
        # Import and check the configuration
        import sys
        sys.path.insert(0, '/app/backend')
        
        from routes.payments import TICKET_PACKS
        
        # Check single packs exist
        assert "single-1" in TICKET_PACKS, "single-1 pack not defined"
        assert "single-2" in TICKET_PACKS, "single-2 pack not defined"
        assert "single-3" in TICKET_PACKS, "single-3 pack not defined"
        
        # Check prices
        assert TICKET_PACKS["single-1"]["amount"] == 1.99, "single-1 should be $1.99"
        assert TICKET_PACKS["single-2"]["amount"] == 3.49, "single-2 should be $3.49"
        assert TICKET_PACKS["single-3"]["amount"] == 4.99, "single-3 should be $4.99"
        
        # Check ticket counts
        assert TICKET_PACKS["single-1"]["tickets"] == 1, "single-1 should give 1 ticket"
        assert TICKET_PACKS["single-2"]["tickets"] == 2, "single-2 should give 2 tickets"
        assert TICKET_PACKS["single-3"]["tickets"] == 3, "single-3 should give 3 tickets"
        
        print("✓ All single ticket packs correctly configured")


class TestOwnerEmailConfiguration:
    """Verify owner email configuration"""
    
    def test_owner_email_defined(self):
        """OWNER_EMAIL should be aaron@simplifii.com.au"""
        import sys
        sys.path.insert(0, '/app/backend')
        
        from utils.tickets import OWNER_EMAIL
        
        assert OWNER_EMAIL == "aaron@simplifii.com.au", f"OWNER_EMAIL should be aaron@simplifii.com.au, got {OWNER_EMAIL}"
        print(f"✓ OWNER_EMAIL correctly set to {OWNER_EMAIL}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
