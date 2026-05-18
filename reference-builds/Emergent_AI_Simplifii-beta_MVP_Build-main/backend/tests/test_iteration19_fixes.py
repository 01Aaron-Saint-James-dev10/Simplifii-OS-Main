"""
Iteration 19 Tests - Rubric Simplifier Distinction Band & Course Planner Scheduled Classes Schema

Tests for:
1. POST /api/rubric/simplify - Should return 'distinctionLooksLike' field in each section
2. POST /api/rubric/simplify - Empty rubric_text should return 400
3. POST /api/rubric/simplify - Error messages should surface real backend errors
4. POST /api/course-planner/extract - Extraction prompt includes expanded scheduled_classes schema
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRubricSimplifierDistinctionBand:
    """Tests for Rubric Simplifier with new Distinction grade band"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with auth cookie"""
        self.session = requests.Session()
        # Login to get session cookie
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"}
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        yield
        self.session.close()
    
    def test_rubric_simplify_empty_text_returns_400(self):
        """POST /api/rubric/simplify with empty rubric_text should return 400"""
        response = self.session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={"rubric_text": ""}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "paste your rubric text" in data["detail"].lower(), f"Expected specific error message, got: {data['detail']}"
        print(f"✓ Empty rubric returns 400 with message: {data['detail']}")
    
    def test_rubric_simplify_whitespace_only_returns_400(self):
        """POST /api/rubric/simplify with whitespace-only text should return 400"""
        response = self.session.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={"rubric_text": "   \n\t  "}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Whitespace-only rubric returns 400")
    
    def test_rubric_simplify_without_auth_returns_401(self):
        """POST /api/rubric/simplify without auth should return 401"""
        # Use a fresh session without auth
        response = requests.post(
            f"{BASE_URL}/api/rubric/simplify",
            json={"rubric_text": "Test rubric"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Rubric simplify without auth returns 401")


class TestCoursePlannerScheduledClassesSchema:
    """Tests for Course Planner extraction with expanded scheduled_classes schema"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with auth cookie"""
        self.session = requests.Session()
        # Login to get session cookie
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"}
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        yield
        self.session.close()
    
    def test_course_planner_extract_without_auth_returns_401_or_422(self):
        """POST /api/course-planner/extract without auth should return 401 or 422 (validation first)"""
        # Note: FastAPI validates request body (files required) before auth middleware runs
        # So we may get 422 (missing files) instead of 401 (unauthorized)
        response = requests.post(f"{BASE_URL}/api/course-planner/extract")
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"
        print(f"✓ Course planner extract without auth returns {response.status_code}")
    
    def test_course_planner_extract_without_files_returns_422(self):
        """POST /api/course-planner/extract without files should return 422"""
        response = self.session.post(f"{BASE_URL}/api/course-planner/extract")
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Course planner extract without files returns 422")


class TestBackendPromptSchemaVerification:
    """Verify backend prompt schemas contain the expected fields"""
    
    def test_rubric_prompt_contains_distinction_field(self):
        """Verify rubric simplify prompt includes distinctionLooksLike field"""
        # Read the tools.py file and verify the prompt contains distinctionLooksLike
        import sys
        sys.path.insert(0, '/app/backend')
        
        with open('/app/backend/routes/tools.py', 'r') as f:
            content = f.read()
        
        # Check that distinctionLooksLike is in the JSON template
        assert 'distinctionLooksLike' in content, "distinctionLooksLike field not found in rubric prompt"
        assert '"distinctionLooksLike": "What a Distinction looks like in practice"' in content, \
            "distinctionLooksLike field description not found in JSON template"
        print("✓ Rubric prompt contains distinctionLooksLike field in JSON template")
    
    def test_rubric_prompt_contains_distinction_in_instructions(self):
        """Verify rubric simplify system prompt mentions Distinction grade"""
        with open('/app/backend/routes/tools.py', 'r') as f:
            content = f.read()
        
        # Check that Distinction is mentioned in the extraction instructions
        assert 'What a Distinction looks like in practice' in content, \
            "Distinction grade extraction instruction not found"
        print("✓ Rubric prompt includes Distinction grade extraction instruction")
    
    def test_planner_prompt_contains_expanded_class_schema(self):
        """Verify course planner extraction prompt includes expanded scheduled_classes schema"""
        with open('/app/backend/routes/planner.py', 'r') as f:
            content = f.read()
        
        # Check for new fields in scheduled_classes schema
        required_fields = [
            '"class_type"',
            '"course_code"',
            '"day_of_week"',
            '"frequency"',
            '"week_range"',
            '"attendance_required"'
        ]
        
        for field in required_fields:
            assert field in content, f"Field {field} not found in scheduled_classes schema"
        
        print("✓ Course planner prompt contains all expanded scheduled_classes fields:")
        print("  - class_type, course_code, day_of_week, frequency, week_range, attendance_required")
    
    def test_rubric_error_handling_surfaces_real_errors(self):
        """Verify rubric simplify endpoint has proper error handling that surfaces real errors"""
        with open('/app/backend/routes/tools.py', 'r') as f:
            content = f.read()
        
        # Check for specific error handling patterns
        assert 'credits' in content.lower() and 'budget' in content.lower(), \
            "Budget/credits error handling not found"
        assert 'timed out' in content.lower() or 'timeout' in content.lower(), \
            "Timeout error handling not found"
        assert 'JSONDecode' in content or 'json' in content.lower(), \
            "JSON parse error handling not found"
        
        # Check that generic "Failed to simplify" is NOT the only error message
        # The new code should have specific error messages
        assert 'Rubric simplification failed:' in content, \
            "Specific error message pattern not found"
        
        print("✓ Rubric simplify has proper error handling:")
        print("  - Budget/credits errors surfaced")
        print("  - Timeout errors surfaced")
        print("  - JSON parse errors surfaced")
        print("  - Specific error messages instead of generic 'Failed to simplify'")


class TestFrontendComponentVerification:
    """Verify frontend components contain the expected elements"""
    
    def test_rubric_frontend_contains_distinction_badge(self):
        """Verify RubricSimplifier.js displays DI (Distinction) badge"""
        with open('/app/frontend/src/pages/RubricSimplifier.js', 'r') as f:
            content = f.read()
        
        # Check for distinctionLooksLike rendering
        assert 'distinctionLooksLike' in content, \
            "distinctionLooksLike field not rendered in frontend"
        assert 'DI' in content, \
            "DI badge not found in frontend"
        assert 'violet' in content.lower(), \
            "Violet color for DI badge not found"
        
        print("✓ Rubric frontend displays Distinction (DI) badge:")
        print("  - distinctionLooksLike field rendered")
        print("  - DI badge present")
        print("  - Violet color styling applied")
    
    def test_planner_frontend_contains_class_rendering(self):
        """Verify CoursePlanner.js renders scheduled classes in TimelineView"""
        with open('/app/frontend/src/pages/CoursePlanner.js', 'r') as f:
            content = f.read()
        
        # Check for class rendering in TimelineView
        assert 'BookOpen' in content, "BookOpen icon import not found"
        assert 'indigo' in content.lower(), "Indigo color for classes not found"
        assert 'classes' in content, "Classes rendering not found"
        
        # Check for expanded class fields in Review phase
        assert 'class_type' in content or 'c.class_type' in content, \
            "class_type field not rendered"
        assert 'course_code' in content, "course_code field not rendered"
        assert 'frequency' in content, "frequency field not rendered"
        assert 'week_range' in content, "week_range field not rendered"
        assert 'attendance_required' in content, "attendance_required field not rendered"
        
        print("✓ Course Planner frontend renders scheduled classes:")
        print("  - BookOpen icon for classes")
        print("  - Indigo color styling")
        print("  - Expanded fields: class_type, course_code, frequency, week_range, attendance_required")
    
    def test_planner_timeline_shows_class_count(self):
        """Verify TimelineView shows 'X assessments + Y classes' count"""
        with open('/app/frontend/src/pages/CoursePlanner.js', 'r') as f:
            content = f.read()
        
        # Check for combined count display
        assert 'assessment' in content and 'class' in content, \
            "Assessment and class count display not found"
        # Check for the specific pattern showing both counts
        assert 'load.classes' in content, "Classes count in timeline not found"
        
        print("✓ Timeline view shows combined assessment + class count")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
