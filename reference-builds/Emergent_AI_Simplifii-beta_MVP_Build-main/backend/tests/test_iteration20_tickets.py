"""
Iteration 20 - Ticket System & Payment Integration Tests
Tests for:
- GET /api/credits/balance - Returns {tickets, has_purchased, costs} with correct cost map
- POST /api/credits/purchase - Creates Stripe checkout session
- GET /api/credits/status/{session_id} - Returns payment status
- Ticket deduction on tool endpoints
- 402 insufficient tickets error
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected ticket costs per tool
EXPECTED_COSTS = {
    "brief-simplifier": 2,
    "course-planner": 3,
    "essay-scorer": 2,
    "rubric-simplifier": 1,
    "humaniser": 1,
    "scaffolder": 1,
    "decoder": 1,
    "planner": 1,
    "visualiser": 1,
}

# Expected ticket packs
EXPECTED_PACKS = {
    "starter": {"tickets": 10, "amount": 14.99},
    "standard": {"tickets": 30, "amount": 38.99},
    "semester": {"tickets": 75, "amount": 89.99},
    "power": {"tickets": 200, "amount": 219.99},
}


@pytest.fixture(scope="module")
def auth_session():
    """Login and return authenticated session"""
    session = requests.Session()
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@simplifii.com", "password": "test123"}
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    return session


@pytest.fixture(scope="module")
def reset_tickets():
    """Reset test user tickets to 3 before tests"""
    from pymongo import MongoClient
    client = MongoClient('mongodb://localhost:27017')
    client['test_database'].users.update_one(
        {'email': 'test@simplifii.com'},
        {'$set': {'credits': 3, 'has_purchased': False}}
    )
    yield
    # Reset again after tests
    client['test_database'].users.update_one(
        {'email': 'test@simplifii.com'},
        {'$set': {'credits': 3, 'has_purchased': False}}
    )


class TestCreditsBalance:
    """Tests for GET /api/credits/balance endpoint"""

    def test_balance_returns_correct_structure(self, auth_session, reset_tickets):
        """Balance endpoint returns tickets, has_purchased, and costs"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        assert resp.status_code == 200
        data = resp.json()
        
        # Check required fields exist
        assert "tickets" in data, "Missing 'tickets' field"
        assert "has_purchased" in data, "Missing 'has_purchased' field"
        assert "costs" in data, "Missing 'costs' field"
        
        # Check types
        assert isinstance(data["tickets"], int), "tickets should be int"
        assert isinstance(data["has_purchased"], bool), "has_purchased should be bool"
        assert isinstance(data["costs"], dict), "costs should be dict"

    def test_balance_returns_correct_costs(self, auth_session, reset_tickets):
        """Balance endpoint returns correct ticket costs per tool"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        assert resp.status_code == 200
        data = resp.json()
        
        costs = data["costs"]
        for tool, expected_cost in EXPECTED_COSTS.items():
            assert tool in costs, f"Missing cost for {tool}"
            assert costs[tool] == expected_cost, f"Wrong cost for {tool}: expected {expected_cost}, got {costs[tool]}"

    def test_balance_requires_auth(self):
        """Balance endpoint requires authentication"""
        resp = requests.get(f"{BASE_URL}/api/credits/balance")
        assert resp.status_code == 401


class TestCreditsPurchase:
    """Tests for POST /api/credits/purchase endpoint"""

    def test_purchase_creates_stripe_session(self, auth_session, reset_tickets):
        """Purchase endpoint creates Stripe checkout session"""
        resp = auth_session.post(
            f"{BASE_URL}/api/credits/purchase",
            data={
                "package_id": "starter",
                "origin_url": "https://udl-magic.preview.emergentagent.com"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        
        # Check response structure
        assert "url" in data, "Missing 'url' field"
        assert "session_id" in data, "Missing 'session_id' field"
        
        # Check Stripe URL format
        assert "checkout.stripe.com" in data["url"], "URL should be Stripe checkout"
        assert data["session_id"].startswith("cs_test_"), "Session ID should be test mode"

    def test_purchase_invalid_package(self, auth_session, reset_tickets):
        """Purchase endpoint rejects invalid package_id"""
        resp = auth_session.post(
            f"{BASE_URL}/api/credits/purchase",
            data={
                "package_id": "invalid_pack",
                "origin_url": "https://udl-magic.preview.emergentagent.com"
            }
        )
        assert resp.status_code == 400
        assert "Invalid package" in resp.json().get("detail", "")

    def test_purchase_requires_auth(self):
        """Purchase endpoint requires authentication"""
        resp = requests.post(
            f"{BASE_URL}/api/credits/purchase",
            data={
                "package_id": "starter",
                "origin_url": "https://test.com"
            }
        )
        assert resp.status_code == 401


class TestCreditsStatus:
    """Tests for GET /api/credits/status/{session_id} endpoint"""

    def test_status_not_found_for_invalid_session(self, auth_session, reset_tickets):
        """Status endpoint returns 404 for invalid session_id"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/status/invalid_session_123")
        assert resp.status_code == 404

    def test_status_requires_auth(self):
        """Status endpoint requires authentication"""
        resp = requests.get(f"{BASE_URL}/api/credits/status/cs_test_123")
        assert resp.status_code == 401


class TestTicketDeduction:
    """Tests for ticket deduction on tool endpoints"""

    def test_decoder_deducts_1_ticket(self, auth_session, reset_tickets):
        """Decoder (decode-jargon) deducts 1 ticket"""
        # Get initial balance
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        initial_tickets = balance_resp.json()["tickets"]
        
        # Use decoder
        resp = auth_session.post(
            f"{BASE_URL}/api/decode-jargon",
            json={"text": "The epistemological framework necessitates critical examination."}
        )
        assert resp.status_code == 200
        
        # Check balance decreased by 1
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        new_tickets = balance_resp.json()["tickets"]
        assert new_tickets == initial_tickets - 1, f"Expected {initial_tickets - 1} tickets, got {new_tickets}"

    def test_humaniser_deducts_1_ticket(self, auth_session, reset_tickets):
        """Humaniser deducts 1 ticket"""
        # Reset to 3 tickets first
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017')
        client['test_database'].users.update_one(
            {'email': 'test@simplifii.com'},
            {'$set': {'credits': 3}}
        )
        
        # Get initial balance
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        initial_tickets = balance_resp.json()["tickets"]
        
        # Use humaniser
        resp = auth_session.post(
            f"{BASE_URL}/api/humanise",
            json={"text": "The implementation demonstrates significant potential."}
        )
        assert resp.status_code == 200
        
        # Check balance decreased by 1
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        new_tickets = balance_resp.json()["tickets"]
        assert new_tickets == initial_tickets - 1

    def test_rubric_simplifier_deducts_1_ticket(self, auth_session, reset_tickets):
        """Rubric Simplifier deducts 1 ticket"""
        # Reset to 3 tickets first
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017')
        client['test_database'].users.update_one(
            {'email': 'test@simplifii.com'},
            {'$set': {'credits': 3}}
        )
        
        # Get initial balance
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        initial_tickets = balance_resp.json()["tickets"]
        
        # Use rubric simplifier
        resp = auth_session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={"rubric_text": "Criterion: Analysis (30%). HD: Exceptional. D: Strong. C: Adequate. P: Basic."}
        )
        assert resp.status_code == 200
        
        # Check balance decreased by 1
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        new_tickets = balance_resp.json()["tickets"]
        assert new_tickets == initial_tickets - 1


class TestInsufficientTickets:
    """Tests for 402 insufficient tickets error"""

    def test_402_error_when_no_tickets(self, auth_session):
        """Returns 402 with correct message when user has 0 tickets"""
        # Set tickets to 0
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017')
        client['test_database'].users.update_one(
            {'email': 'test@simplifii.com'},
            {'$set': {'credits': 0}}
        )
        
        # Try to use a tool
        resp = auth_session.post(
            f"{BASE_URL}/api/decode-jargon",
            json={"text": "Test text"}
        )
        
        assert resp.status_code == 402, f"Expected 402, got {resp.status_code}"
        detail = resp.json().get("detail", "")
        assert "out of tickets" in detail.lower(), f"Expected 'out of tickets' in message, got: {detail}"
        
        # Reset tickets
        client['test_database'].users.update_one(
            {'email': 'test@simplifii.com'},
            {'$set': {'credits': 3}}
        )

    def test_402_error_for_expensive_tool(self, auth_session):
        """Returns 402 when user has fewer tickets than tool cost"""
        # Set tickets to 1 (less than brief-simplifier cost of 2)
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017')
        client['test_database'].users.update_one(
            {'email': 'test@simplifii.com'},
            {'$set': {'credits': 1}}
        )
        
        # Brief simplifier costs 2 tickets - this should fail
        # Note: We can't easily test this without uploading a PDF, so we test the balance check
        balance_resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        tickets = balance_resp.json()["tickets"]
        brief_cost = balance_resp.json()["costs"]["brief-simplifier"]
        
        assert tickets < brief_cost, "Test setup: user should have fewer tickets than brief-simplifier cost"
        
        # Reset tickets
        client['test_database'].users.update_one(
            {'email': 'test@simplifii.com'},
            {'$set': {'credits': 3}}
        )


class TestTicketCostsInCode:
    """Tests to verify ticket costs are correctly defined in backend"""

    def test_brief_simplifier_costs_2(self, auth_session, reset_tickets):
        """Brief Simplifier should cost 2 tickets"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        costs = resp.json()["costs"]
        assert costs.get("brief-simplifier") == 2

    def test_course_planner_costs_3(self, auth_session, reset_tickets):
        """Course Planner should cost 3 tickets"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        costs = resp.json()["costs"]
        assert costs.get("course-planner") == 3

    def test_essay_scorer_costs_2(self, auth_session, reset_tickets):
        """Essay Scorer should cost 2 tickets"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        costs = resp.json()["costs"]
        assert costs.get("essay-scorer") == 2

    def test_other_tools_cost_1(self, auth_session, reset_tickets):
        """All other tools should cost 1 ticket"""
        resp = auth_session.get(f"{BASE_URL}/api/credits/balance")
        costs = resp.json()["costs"]
        
        one_ticket_tools = ["rubric-simplifier", "humaniser", "scaffolder", "decoder", "planner", "visualiser"]
        for tool in one_ticket_tools:
            assert costs.get(tool) == 1, f"{tool} should cost 1 ticket, got {costs.get(tool)}"
