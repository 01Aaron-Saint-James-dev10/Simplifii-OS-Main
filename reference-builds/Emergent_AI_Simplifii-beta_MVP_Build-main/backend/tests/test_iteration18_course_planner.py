"""
Iteration 18 - Course Planner Two-Phase Pipeline Tests
Tests for:
- POST /api/course-planner/extract (PDF upload, returns job_id)
- GET /api/course-planner/extract/status/{job_id} (polling)
- POST /api/course-planner/confirm (save confirmed extraction)
- POST /api/course-planner/study-plan (AI study plan generation)
- POST /api/course-planner/export-ics (ICS calendar export)
- GET /api/user/quick-win (dashboard widget recommendation)
"""

import pytest
import requests
import os
import time
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@simplifii.com"
TEST_PASSWORD = "test123"


def create_test_pdf():
    """Create a test PDF with course outline content."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Title
    c.setFont('Helvetica-Bold', 18)
    c.drawString(50, height - 50, 'COMP1511 - Programming Fundamentals')
    c.drawString(50, height - 75, 'Course Outline - Semester 1, 2025')

    # University
    c.setFont('Helvetica', 12)
    c.drawString(50, height - 110, 'University of New South Wales')
    c.drawString(50, height - 130, 'Semester Start: 17 February 2025')
    c.drawString(50, height - 150, 'Semester End: 30 May 2025')
    c.drawString(50, height - 170, 'Total Weeks: 13')

    # Assessments
    c.setFont('Helvetica-Bold', 14)
    c.drawString(50, height - 210, 'Assessment Tasks')

    c.setFont('Helvetica', 11)
    assessments = [
        'Assignment 1: Introduction to C - 15% - Due Week 4 (14 March 2025)',
        'Assignment 2: Data Structures - 20% - Due Week 8 (11 April 2025)',
        'Lab Exercises: Weekly Labs - 10% - Ongoing throughout semester',
        'Mid-term Exam: Written Exam - 20% - Week 7 (4 April 2025)',
        'Final Exam: Written Exam - 35% - Exam Period (June 2025)',
    ]

    y = height - 240
    for a in assessments:
        c.drawString(60, y, '- ' + a)
        y -= 20

    # Classes
    c.setFont('Helvetica-Bold', 14)
    c.drawString(50, y - 20, 'Scheduled Classes')

    c.setFont('Helvetica', 11)
    classes = [
        'Lecture: Monday 10:00-12:00, Room K17-LG01 (Mandatory)',
        'Tutorial: Wednesday 14:00-16:00, Room K17-302',
        'Lab: Friday 09:00-11:00, Room K17-Lab1',
    ]

    y = y - 50
    for cl in classes:
        c.drawString(60, y, '- ' + cl)
        y -= 20

    # Important dates
    c.setFont('Helvetica-Bold', 14)
    c.drawString(50, y - 20, 'Important Dates')

    c.setFont('Helvetica', 11)
    dates = [
        'Census Date: 14 March 2025',
        'Flexibility Week: Week 6 (28 March - 3 April)',
        'Study Break: Week 12 (19-23 May)',
    ]

    y = y - 50
    for d in dates:
        c.drawString(60, y, '- ' + d)
        y -= 20

    c.save()
    buffer.seek(0)
    return buffer


@pytest.fixture(scope="module")
def session():
    """Create session without global Content-Type header."""
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def auth_session(session):
    """Login and return authenticated session."""
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return session


class TestCoursePlannerExtraction:
    """Phase 1: Extract & Map tests"""

    def test_extract_without_auth_returns_401(self, session):
        """Test that extraction requires authentication."""
        new_session = requests.Session()
        pdf_buffer = create_test_pdf()
        files = [('files', ('test_outline.pdf', pdf_buffer, 'application/pdf'))]
        response = new_session.post(f"{BASE_URL}/api/course-planner/extract", files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Extract without auth returns 401")

    def test_extract_returns_job_id_immediately(self, auth_session):
        """Test POST /api/course-planner/extract returns job_id and status:processing."""
        pdf_buffer = create_test_pdf()
        files = [('files', ('test_outline.pdf', pdf_buffer, 'application/pdf'))]
        
        start_time = time.time()
        response = auth_session.post(
            f"{BASE_URL}/api/course-planner/extract",
            files=files
        )
        elapsed = time.time() - start_time
        
        assert response.status_code == 200, f"Extract failed: {response.text}"
        data = response.json()
        
        # Verify immediate response (should be < 15 seconds)
        assert elapsed < 15, f"Response took too long: {elapsed}s (should be < 15s)"
        
        # Verify response structure
        assert "job_id" in data, "Response missing job_id"
        assert "status" in data, "Response missing status"
        assert data["status"] == "processing", f"Expected status 'processing', got '{data['status']}'"
        assert data["job_id"].startswith("plan_"), f"Job ID should start with 'plan_', got '{data['job_id']}'"
        
        print(f"PASS: Extract returns job_id immediately ({elapsed:.2f}s)")
        print(f"  Job ID: {data['job_id']}")
        
        # Store job_id for next test
        auth_session.last_job_id = data["job_id"]

    def test_extraction_status_polling(self, auth_session):
        """Test GET /api/course-planner/extract/status/{job_id} polling."""
        job_id = getattr(auth_session, 'last_job_id', None)
        if not job_id:
            pytest.skip("No job_id from previous test")
        
        # Poll for completion (max 120 seconds)
        max_polls = 40
        poll_interval = 3
        final_status = None
        result = None
        
        for i in range(max_polls):
            response = auth_session.get(f"{BASE_URL}/api/course-planner/extract/status/{job_id}")
            assert response.status_code == 200, f"Status check failed: {response.text}"
            
            data = response.json()
            status = data.get("status")
            
            if status == "complete":
                final_status = "complete"
                result = data.get("result")
                print(f"PASS: Extraction completed after {(i+1)*poll_interval}s")
                break
            elif status == "error":
                final_status = "error"
                print(f"FAIL: Extraction failed: {data.get('error')}")
                break
            else:
                progress = data.get("progress", "Working...")
                print(f"  Poll {i+1}: {status} - {progress}")
            
            time.sleep(poll_interval)
        
        assert final_status == "complete", f"Extraction did not complete: {final_status}"
        assert result is not None, "No result returned"
        
        # Store result for next tests
        auth_session.extraction_result = result

    def test_extraction_result_structure(self, auth_session):
        """Test Phase 1 extraction result has required keys."""
        result = getattr(auth_session, 'extraction_result', None)
        if not result:
            pytest.skip("No extraction result from previous test")
        
        # Verify top-level keys
        required_keys = ["assessments", "scheduled_classes", "important_dates", "document_intelligence"]
        for key in required_keys:
            assert key in result, f"Missing required key: {key}"
        
        print(f"PASS: Extraction result has all required keys: {required_keys}")

    def test_extraction_assessments_structure(self, auth_session):
        """Test each assessment has required fields."""
        result = getattr(auth_session, 'extraction_result', None)
        if not result:
            pytest.skip("No extraction result from previous test")
        
        assessments = result.get("assessments", [])
        assert len(assessments) > 0, "No assessments extracted"
        
        required_fields = [
            "assessment_title", "course_code", "university", "due_date",
            "week_number", "weighting", "assessment_type", "is_ongoing",
            "is_group_work", "submission_format", "notes"
        ]
        
        for i, a in enumerate(assessments):
            for field in required_fields:
                assert field in a, f"Assessment {i} missing field: {field}"
        
        print(f"PASS: All {len(assessments)} assessments have required fields")
        for a in assessments[:3]:
            print(f"  - {a['assessment_title']} ({a['assessment_type']}) - {a['weighting']}")

    def test_document_intelligence_structure(self, auth_session):
        """Test document_intelligence has required fields."""
        result = getattr(auth_session, 'extraction_result', None)
        if not result:
            pytest.skip("No extraction result from previous test")
        
        intel = result.get("document_intelligence", {})
        required_fields = [
            "semester_start", "semester_end", "total_weeks",
            "university", "term_label", "needs_semester_start_confirmation"
        ]
        
        for field in required_fields:
            assert field in intel, f"document_intelligence missing field: {field}"
        
        print(f"PASS: document_intelligence has all required fields")
        print(f"  University: {intel.get('university')}")
        print(f"  Term: {intel.get('term_label')}")
        print(f"  Semester Start: {intel.get('semester_start')}")
        print(f"  Needs Confirmation: {intel.get('needs_semester_start_confirmation')}")


class TestCoursePlannerConfirm:
    """Phase 1 confirmation tests"""

    def test_confirm_extraction(self, auth_session):
        """Test POST /api/course-planner/confirm saves data."""
        result = getattr(auth_session, 'extraction_result', None)
        if not result:
            # Create a minimal extraction for testing
            result = {
                "assessments": [
                    {
                        "assessment_title": "Test Assignment",
                        "course_code": "TEST101",
                        "university": "Test University",
                        "due_date": "Week 4",
                        "week_number": 4,
                        "weighting": "20%",
                        "assessment_type": "essay",
                        "is_ongoing": False,
                        "is_group_work": False,
                        "submission_format": "2000 words",
                        "notes": ""
                    }
                ],
                "scheduled_classes": [],
                "important_dates": [],
                "document_intelligence": {
                    "semester_start": "Not stated in document",
                    "semester_end": "Not stated in document",
                    "total_weeks": 13,
                    "university": "Test University",
                    "term_label": "Semester 1",
                    "needs_semester_start_confirmation": True
                }
            }
        
        response = auth_session.post(
            f"{BASE_URL}/api/course-planner/confirm",
            json={
                "extraction": result,
                "semester_start": "2025-02-17"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Confirm failed: {response.text}"
        data = response.json()
        assert data.get("status") == "confirmed", f"Expected status 'confirmed', got '{data.get('status')}'"
        
        print("PASS: Extraction confirmed successfully")
        
        # Store for study plan test
        auth_session.confirmed_extraction = result


class TestStudyPlanGeneration:
    """AI Study Plan generation tests"""

    def test_study_plan_without_assessments_returns_400(self, auth_session):
        """Test study plan requires assessments."""
        response = auth_session.post(
            f"{BASE_URL}/api/course-planner/study-plan",
            json={"assessments": [], "semester_start": "2025-02-17"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Study plan without assessments returns 400")

    def test_study_plan_generation(self, auth_session):
        """Test POST /api/course-planner/study-plan generates valid plan."""
        result = getattr(auth_session, 'confirmed_extraction', None)
        if not result:
            result = {
                "assessments": [
                    {
                        "assessment_title": "Essay Assignment",
                        "course_code": "COMP1511",
                        "due_date": "Week 4",
                        "week_number": 4,
                        "weighting": "20%",
                        "assessment_type": "essay",
                        "is_ongoing": False
                    },
                    {
                        "assessment_title": "Final Exam",
                        "course_code": "COMP1511",
                        "due_date": "Exam Period",
                        "week_number": None,
                        "weighting": "35%",
                        "assessment_type": "exam",
                        "is_ongoing": False
                    }
                ]
            }
        
        response = auth_session.post(
            f"{BASE_URL}/api/course-planner/study-plan",
            json={
                "assessments": result.get("assessments", []),
                "semester_start": "2025-02-17"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Study plan failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "weeklyPlan" in data, "Missing weeklyPlan"
        assert "priorityOrder" in data, "Missing priorityOrder"
        assert "overallAdvice" in data, "Missing overallAdvice"
        
        # Verify weeklyPlan structure
        assert isinstance(data["weeklyPlan"], list), "weeklyPlan should be a list"
        if len(data["weeklyPlan"]) > 0:
            week = data["weeklyPlan"][0]
            assert "week" in week, "Week missing 'week' field"
            assert "focus" in week, "Week missing 'focus' field"
            assert "tasks" in week, "Week missing 'tasks' field"
        
        print(f"PASS: Study plan generated with {len(data['weeklyPlan'])} weeks")
        print(f"  Overall advice: {data['overallAdvice'][:100]}...")


class TestICSExport:
    """ICS calendar export tests"""

    def test_export_ics(self, auth_session):
        """Test POST /api/course-planner/export-ics generates valid .ics file."""
        assessments = [
            {
                "assessment_title": "Test Assignment",
                "course_code": "COMP1511",
                "due_date": "Week 4",
                "weighting": "20%",
                "notes": "Test notes"
            }
        ]
        
        response = auth_session.post(
            f"{BASE_URL}/api/course-planner/export-ics",
            json={"assessments": assessments},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"ICS export failed: {response.text}"
        
        # Verify content type
        content_type = response.headers.get("content-type", "")
        assert "text/calendar" in content_type, f"Expected text/calendar, got {content_type}"
        
        # Verify content disposition
        content_disp = response.headers.get("content-disposition", "")
        assert "simplifii_semester.ics" in content_disp, f"Missing filename in disposition: {content_disp}"
        
        # Verify ICS content
        ics_content = response.text
        assert "BEGIN:VCALENDAR" in ics_content, "Missing VCALENDAR start"
        assert "END:VCALENDAR" in ics_content, "Missing VCALENDAR end"
        assert "BEGIN:VEVENT" in ics_content, "Missing VEVENT"
        assert "COMP1511" in ics_content, "Missing course code in event"
        
        print("PASS: ICS export successful")
        print(f"  Content length: {len(ics_content)} bytes")


class TestQuickWin:
    """Dashboard Quick Win widget tests"""

    def test_quick_win_endpoint(self, auth_session):
        """Test GET /api/user/quick-win returns recommendation."""
        response = auth_session.get(f"{BASE_URL}/api/user/quick-win")
        
        assert response.status_code == 200, f"Quick win failed: {response.text}"
        data = response.json()
        
        # Verify response has has_data field
        assert "has_data" in data, "Missing has_data field"
        
        if data["has_data"]:
            # If user has planner data, verify recommendation fields
            assert "assessment" in data, "Missing assessment field"
            assert "recommended_tool" in data, "Missing recommended_tool field"
            assert "recommended_name" in data, "Missing recommended_name field"
            assert "action" in data, "Missing action field"
            
            print(f"PASS: Quick Win has data")
            print(f"  Assessment: {data.get('assessment')}")
            print(f"  Recommended: {data.get('recommended_name')}")
            print(f"  Action: {data.get('action')}")
        else:
            # If no data, should have message
            assert "message" in data, "Missing message when no data"
            print(f"PASS: Quick Win returns no-data message: {data.get('message')}")

    def test_quick_win_without_auth_returns_401(self, session):
        """Test quick win requires authentication."""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/user/quick-win")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Quick win without auth returns 401")


class TestEdgeCases:
    """Edge case and error handling tests"""

    def test_extract_with_no_files_returns_422(self, auth_session):
        """Test extraction with no files returns validation error."""
        response = auth_session.post(
            f"{BASE_URL}/api/course-planner/extract",
            headers={"Content-Type": "application/json"}
        )
        # FastAPI returns 422 for missing required fields
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("PASS: Extract with no files returns 422")

    def test_status_with_invalid_job_id_returns_404(self, auth_session):
        """Test status check with invalid job_id returns 404."""
        response = auth_session.get(f"{BASE_URL}/api/course-planner/extract/status/invalid_job_123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid job_id returns 404")

    def test_extract_with_max_files(self, auth_session):
        """Test extraction accepts up to 10 files."""
        # Create 10 small PDFs
        files = []
        for i in range(10):
            pdf_buffer = create_test_pdf()
            files.append(('files', (f'test_{i}.pdf', pdf_buffer, 'application/pdf')))
        
        response = auth_session.post(f"{BASE_URL}/api/course-planner/extract", files=files)
        assert response.status_code == 200, f"10 files should be accepted: {response.text}"
        print("PASS: 10 files accepted")

    def test_extract_with_too_many_files_returns_400(self, auth_session):
        """Test extraction rejects more than 10 files."""
        # Create 11 small PDFs
        files = []
        for i in range(11):
            pdf_buffer = create_test_pdf()
            files.append(('files', (f'test_{i}.pdf', pdf_buffer, 'application/pdf')))
        
        response = auth_session.post(f"{BASE_URL}/api/course-planner/extract", files=files)
        assert response.status_code == 400, f"Expected 400 for 11 files, got {response.status_code}"
        print("PASS: 11 files rejected with 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
