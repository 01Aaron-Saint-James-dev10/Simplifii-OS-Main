"""
Iteration 21 - Testing new features:
1. Rubric Simplifier accepts optional brief_text field
2. Rubric Simplifier response includes selfAssessmentChecklist, neuroaffirmingTip per section, microTasks per step
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@simplifii.com"
TEST_PASSWORD = "test123"

# Small rubric for testing (as suggested in agent_to_agent_context_note)
SMALL_RUBRIC = """Criterion 1: Critical Analysis (30%)
HD: Exceptional critical engagement with scholarly literature.
D: Strong critical analysis with clear theoretical application.
CR: Adequate analysis of key sources.
P: Basic attempt at analysis.

Criterion 2: Presentation (20%)
HD: Harvard referencing used throughout with zero errors. Word count: 2000 words.
P: Referencing present but inconsistent."""

SMALL_BRIEF = """Assessment Brief: Literature Review
Topic: Impact of social media on mental health
Word count: 2000 words
Due date: Week 10
Submission: Turnitin via LMS
Referencing: Harvard style"""


@pytest.fixture(scope="module")
def session():
    """Create a requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_cookies(session):
    """Login and get auth cookies"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    return session.cookies


class TestRubricSimplifierBackend:
    """Test Rubric Simplifier API with new features"""
    
    def test_rubric_simplify_accepts_optional_brief_text(self, session, auth_cookies):
        """POST /api/rubric/simplify accepts optional brief_text field"""
        # Test with brief_text
        response = session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={
                "rubric_text": SMALL_RUBRIC,
                "brief_text": SMALL_BRIEF
            },
            cookies=auth_cookies,
            timeout=120
        )
        
        # Should accept the request (may fail due to insufficient tickets, but should not be 400/422)
        assert response.status_code in [200, 402], f"Expected 200 or 402, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Rubric simplify with brief_text succeeded")
            print(f"Response keys: {data.keys()}")
            
            # Verify response structure includes new fields
            assert "sections" in data, "Response should have 'sections'"
            
            if data.get("sections"):
                section = data["sections"][0]
                print(f"First section keys: {section.keys()}")
                
                # Check for neuroaffirmingTip per section
                assert "neuroaffirmingTip" in section, "Each section should have 'neuroaffirmingTip'"
                print(f"neuroaffirmingTip: {section.get('neuroaffirmingTip', 'N/A')[:100]}...")
                
                # Check for steps with microTasks
                if section.get("steps"):
                    step = section["steps"][0]
                    print(f"First step keys: {step.keys()}")
                    assert "microTasks" in step, "Each step should have 'microTasks'"
                    print(f"microTasks: {step.get('microTasks', [])}")
            
            # Check for selfAssessmentChecklist
            assert "selfAssessmentChecklist" in data, "Response should have 'selfAssessmentChecklist'"
            print(f"selfAssessmentChecklist: {data.get('selfAssessmentChecklist', [])}")
        else:
            print(f"Got 402 (insufficient tickets) - this is expected if user has 0 tickets")
    
    def test_rubric_simplify_without_brief_text(self, session, auth_cookies):
        """POST /api/rubric/simplify works without brief_text (backward compatible)"""
        response = session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={
                "rubric_text": SMALL_RUBRIC
                # No brief_text - should still work
            },
            cookies=auth_cookies,
            timeout=120
        )
        
        assert response.status_code in [200, 402], f"Expected 200 or 402, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Rubric simplify without brief_text succeeded")
            assert "sections" in data
        else:
            print(f"Got 402 (insufficient tickets)")
    
    def test_rubric_simplify_requires_rubric_text(self, session, auth_cookies):
        """POST /api/rubric/simplify requires rubric_text"""
        response = session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={"rubric_text": ""},
            cookies=auth_cookies
        )
        
        assert response.status_code == 400, f"Expected 400 for empty rubric_text, got {response.status_code}"
        print("Empty rubric_text rejected with 400")


class TestRubricSimplifyRequestModel:
    """Test that the RubricSimplifyRequest model accepts brief_text"""
    
    def test_model_accepts_brief_text_field(self, session, auth_cookies):
        """Verify the API accepts brief_text in the request body"""
        # This tests that the Pydantic model has been updated
        response = session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={
                "rubric_text": "Test rubric",
                "brief_text": "Test brief"
            },
            cookies=auth_cookies
        )
        
        # Should not get 422 (validation error) for unknown field
        assert response.status_code != 422, f"Got 422 - brief_text field not accepted: {response.text}"
        print(f"brief_text field accepted (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
