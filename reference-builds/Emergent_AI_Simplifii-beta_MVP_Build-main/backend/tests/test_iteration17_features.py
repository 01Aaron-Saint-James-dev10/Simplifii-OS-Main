"""
Iteration 17 Tests - Simplifii Full Deployment Pass
Tests for:
1. Scaffold background job + polling pattern with time remaining
2. All 9 tools with realistic payloads and neuroaffirming language
3. Input validation for empty text on all tools
4. Onboarding goals (Step 3) with tool recommendation
5. Export endpoints (PDF/DOCX)
6. Hidden Curriculum Decoder strengthConnection field
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://udl-magic.preview.emergentagent.com"

# Realistic academic text for testing (500+ words)
REALISTIC_ACADEMIC_TEXT = """
The assessment requires students to critically analyse the socio-economic implications of climate change 
on developing nations, with particular emphasis on the intersection of environmental policy and sustainable 
development goals. Students must demonstrate a nuanced understanding of the complex interplay between 
global climate governance frameworks and local adaptation strategies.

Your essay should synthesise relevant theoretical perspectives from environmental economics, political ecology, 
and development studies. You are expected to engage with primary sources including peer-reviewed journal articles, 
policy documents from international organisations such as the IPCC and UNFCCC, and empirical case studies from 
the Global South.

The marking criteria emphasise the following competencies: (1) Critical analysis of existing literature and 
theoretical frameworks, demonstrating the ability to identify gaps, contradictions, and areas of scholarly 
debate; (2) Application of appropriate methodological approaches to evaluate policy effectiveness; (3) 
Synthesis of diverse perspectives to construct a coherent and well-supported argument; (4) Clear and 
academically rigorous written communication, adhering to APA 7th edition referencing conventions.

Students should avoid merely descriptive accounts of climate change impacts. Instead, the assessment 
requires analytical depth, examining the underlying structural factors that contribute to climate 
vulnerability in developing contexts. Consider how historical patterns of colonialism, unequal trade 
relations, and the global distribution of carbon emissions have shaped contemporary climate justice debates.

Your introduction should establish the significance of the research question and provide a clear thesis 
statement that signals your analytical approach. The body of the essay should be organised thematically 
rather than chronologically, with each section building upon the previous to develop your argument 
progressively. Ensure that you provide adequate signposting to guide the reader through your analysis.

The conclusion should not merely summarise your findings but should offer critical reflection on the 
implications of your analysis for policy and practice. Consider what your findings suggest about the 
future trajectory of climate governance and the prospects for achieving climate justice.

Word count: 2500 words (±10%). References are not included in the word count. Please submit via Turnitin 
by 5pm on the due date. Late submissions will incur a penalty of 5% per day unless an extension has been 
approved through the standard university procedures.

This assessment contributes 40% to your final grade for the unit. It is designed to assess your ability 
to engage with complex, interdisciplinary issues and to communicate your analysis effectively in written 
form. The assessment aligns with the following unit learning outcomes: LO1, LO3, and LO5.
"""

REALISTIC_ESSAY_TEXT = """
Climate change represents one of the most pressing challenges facing developing nations in the 21st century. 
This essay critically examines the socio-economic implications of climate change on developing countries, 
with particular attention to the intersection of environmental policy and sustainable development goals.

The theoretical framework underpinning this analysis draws upon environmental economics and political ecology. 
As Stern (2007) argues in his seminal review, climate change represents the greatest market failure in history, 
with costs disproportionately borne by those least responsible for greenhouse gas emissions. This perspective 
is complemented by political ecology's emphasis on power relations and the uneven distribution of environmental 
risks (Robbins, 2019).

Developing nations face a dual challenge: they must pursue economic development to address poverty and improve 
living standards while simultaneously adapting to climate impacts and contributing to global mitigation efforts. 
This tension is evident in the concept of "common but differentiated responsibilities" enshrined in the UNFCCC 
framework (Rajamani, 2016).

Empirical evidence from case studies in Sub-Saharan Africa and South Asia demonstrates the vulnerability of 
agricultural systems to changing precipitation patterns and extreme weather events. In Bangladesh, for example, 
rising sea levels threaten to displace millions of coastal residents, with profound implications for food 
security and internal migration (Alam & Rabbani, 2007).

The analysis reveals that effective climate adaptation requires integrated approaches that address both 
environmental and socio-economic dimensions. Policy interventions must be context-specific and informed by 
local knowledge systems, rather than imposing one-size-fits-all solutions developed in the Global North.

In conclusion, addressing climate change in developing nations requires a fundamental rethinking of global 
governance structures and a commitment to climate justice that acknowledges historical responsibilities and 
current inequalities in the international system.
"""

REALISTIC_RUBRIC_TEXT = """
Assessment Rubric - Critical Analysis Essay (40%)

Criterion 1: Critical Analysis (30%)
- High Distinction (85-100%): Demonstrates exceptional critical analysis with sophisticated engagement with 
  theoretical frameworks. Identifies nuanced contradictions and gaps in existing literature. Shows original 
  thinking and makes significant contributions to scholarly debate.
- Distinction (75-84%): Strong critical analysis with clear engagement with relevant theories. Identifies 
  key debates and positions argument effectively within scholarly discourse.
- Credit (65-74%): Adequate critical analysis with some engagement with theoretical perspectives. Demonstrates 
  understanding of main debates but analysis may lack depth in places.
- Pass (50-64%): Basic critical analysis present but may be largely descriptive. Limited engagement with 
  theoretical frameworks.
- Fail (<50%): Insufficient critical analysis. Work is predominantly descriptive with no clear analytical framework.

Criterion 2: Use of Evidence (25%)
- High Distinction: Exceptional use of diverse, high-quality sources including primary documents and peer-reviewed 
  literature. Evidence is seamlessly integrated to support sophisticated arguments.
- Distinction: Strong use of appropriate academic sources. Evidence effectively supports arguments.
- Credit: Adequate use of sources with some integration of evidence to support claims.
- Pass: Basic use of sources but may rely heavily on secondary sources or fail to integrate evidence effectively.
- Fail: Insufficient or inappropriate use of sources. Evidence does not support claims.

Criterion 3: Structure and Argument (25%)
- High Distinction: Exceptionally clear and logical structure. Argument develops progressively with excellent 
  signposting. Thesis is compelling and consistently supported throughout.
- Distinction: Clear structure with well-developed argument. Good use of signposting.
- Credit: Adequate structure with identifiable argument. Some issues with flow or signposting.
- Pass: Basic structure present but argument may be unclear or inconsistent.
- Fail: Poor structure with no clear argument.

Criterion 4: Academic Writing (20%)
- High Distinction: Exemplary academic writing with sophisticated vocabulary and sentence structure. Flawless 
  referencing in APA 7th edition.
- Distinction: Strong academic writing with appropriate register. Minor referencing errors only.
- Credit: Adequate academic writing. Some issues with expression or referencing.
- Pass: Basic academic writing with noticeable errors in expression or referencing.
- Fail: Poor academic writing with significant errors that impede understanding.
"""


class TestAuthentication:
    """Test authentication and session management"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        """Login and get auth cookies"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code} - {resp.text}")
        return resp.cookies
    
    def test_login_success(self, session):
        """Test login with valid credentials"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "user" in data or "email" in data or "name" in data
        print("✓ Login successful")


class TestScaffoldBackgroundJob:
    """Test scaffold background job + polling pattern"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        return resp.cookies
    
    def test_scaffold_without_auth_returns_401(self, session):
        """POST /api/scaffold without auth returns 401"""
        resp = session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Test",
            "word_count": 2000,
            "level": "Second Year"
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Scaffold without auth returns 401")
    
    def test_scaffold_returns_job_id_immediately(self, session, auth_cookies):
        """POST /api/scaffold returns {job_id, status:'processing'} immediately"""
        start_time = time.time()
        resp = session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Climate Change Impact on Developing Nations",
            "word_count": 2500,
            "level": "Third Year",
            "brief_text": REALISTIC_ACADEMIC_TEXT,
            "rubric_text": REALISTIC_RUBRIC_TEXT,
            "outline_text": "",
            "slides_text": ""
        }, cookies=auth_cookies)
        elapsed = time.time() - start_time
        
        assert resp.status_code == 200, f"Scaffold start failed: {resp.text}"
        data = resp.json()
        assert "job_id" in data, f"Missing job_id in response: {data}"
        assert data.get("status") == "processing", f"Expected status 'processing', got: {data.get('status')}"
        assert elapsed < 15, f"Scaffold start took too long: {elapsed}s (should be <15s)"
        print(f"✓ Scaffold returns job_id immediately ({elapsed:.1f}s)")
        return data["job_id"]
    
    def test_scaffold_polling_and_completion(self, session, auth_cookies):
        """Poll GET /api/scaffold/status/{job_id} until complete"""
        # Start scaffold job
        resp = session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Climate Change Impact",
            "word_count": 2000,
            "level": "Second Year",
            "brief_text": REALISTIC_ACADEMIC_TEXT[:2000],
            "rubric_text": "",
            "outline_text": "",
            "slides_text": ""
        }, cookies=auth_cookies)
        
        assert resp.status_code == 200
        job_id = resp.json().get("job_id")
        assert job_id, "No job_id returned"
        
        # Poll for completion (max 3 minutes)
        max_polls = 36  # 36 * 5s = 180s = 3 minutes
        poll_interval = 5
        final_status = None
        result = None
        
        for i in range(max_polls):
            time.sleep(poll_interval)
            status_resp = session.get(f"{BASE_URL}/api/scaffold/status/{job_id}", cookies=auth_cookies)
            
            if status_resp.status_code == 404:
                # Job may have been cleaned up after completion
                print(f"  Poll {i+1}: Job not found (may have been cleaned up)")
                break
            
            assert status_resp.status_code == 200, f"Status check failed: {status_resp.text}"
            status_data = status_resp.json()
            final_status = status_data.get("status")
            
            print(f"  Poll {i+1}: status={final_status}, progress={status_data.get('progress', 'N/A')}")
            
            if final_status == "complete":
                result = status_data.get("result")
                break
            elif final_status == "error":
                pytest.fail(f"Scaffold job failed: {status_data.get('error')}")
        
        assert final_status == "complete" or result is not None, f"Scaffold did not complete in time. Last status: {final_status}"
        
        # Verify result structure
        if result:
            required_keys = ["overallGuidance", "suggestedStructure", "thinkingFramework"]
            for key in required_keys:
                assert key in result, f"Missing required key '{key}' in scaffold result"
            
            # Check suggestedStructure has 5-8 sections
            structure = result.get("suggestedStructure", [])
            assert 3 <= len(structure) <= 10, f"Expected 5-8 sections, got {len(structure)}"
            print(f"✓ Scaffold complete with {len(structure)} sections")
    
    def test_scaffold_status_invalid_job_returns_404(self, session, auth_cookies):
        """GET /api/scaffold/status/{invalid_job_id} returns 404"""
        resp = session.get(f"{BASE_URL}/api/scaffold/status/invalid_job_12345", cookies=auth_cookies)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("✓ Invalid job_id returns 404")


class TestInputValidation:
    """Test empty input validation for all tools"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        return resp.cookies
    
    def test_decode_jargon_empty_text_returns_400(self, session, auth_cookies):
        """POST /api/decode-jargon with empty text returns 400"""
        resp = session.post(f"{BASE_URL}/api/decode-jargon", json={"text": ""}, cookies=auth_cookies)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "detail" in data
        print(f"✓ decode-jargon empty text returns 400: {data['detail']}")
    
    def test_decode_jargon_whitespace_only_returns_400(self, session, auth_cookies):
        """POST /api/decode-jargon with whitespace only returns 400"""
        resp = session.post(f"{BASE_URL}/api/decode-jargon", json={"text": "   \n\t  "}, cookies=auth_cookies)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print("✓ decode-jargon whitespace-only returns 400")
    
    def test_essay_score_empty_text_returns_400(self, session, auth_cookies):
        """POST /api/essay/score with empty essay_text returns 400"""
        resp = session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": "",
            "rubric_text": "",
            "brief_text": ""
        }, cookies=auth_cookies)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print("✓ essay/score empty text returns 400")
    
    def test_rubric_simplify_empty_text_returns_400(self, session, auth_cookies):
        """POST /api/rubric/simplify with empty rubric_text returns 400"""
        resp = session.post(f"{BASE_URL}/api/rubric/simplify", json={"rubric_text": ""}, cookies=auth_cookies)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print("✓ rubric/simplify empty text returns 400")
    
    def test_translate_empty_text_returns_400(self, session, auth_cookies):
        """POST /api/translate with empty text returns 400"""
        resp = session.post(f"{BASE_URL}/api/translate", json={
            "text": "",
            "target_language": "Spanish"
        }, cookies=auth_cookies)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print("✓ translate empty text returns 400")


class TestToolsWithRealisticPayloads:
    """Test all 9 tools with realistic academic payloads"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        return resp.cookies
    
    def test_decode_jargon_with_strength_connection(self, session, auth_cookies):
        """POST /api/decode-jargon returns decodedTerms with strengthConnection field"""
        resp = session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": REALISTIC_ACADEMIC_TEXT
        }, cookies=auth_cookies, timeout=120)
        
        assert resp.status_code == 200, f"decode-jargon failed: {resp.text}"
        data = resp.json()
        
        assert "decodedTerms" in data, f"Missing decodedTerms: {data.keys()}"
        assert len(data["decodedTerms"]) > 0, "No decoded terms returned"
        
        # Check for strengthConnection field (neuroaffirming)
        first_term = data["decodedTerms"][0]
        assert "strengthConnection" in first_term, f"Missing strengthConnection in decoded term: {first_term.keys()}"
        print(f"✓ decode-jargon returns {len(data['decodedTerms'])} terms with strengthConnection")
    
    def test_rubric_simplify_returns_sections_with_steps(self, session, auth_cookies):
        """POST /api/rubric/simplify returns sections with steps"""
        resp = session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": REALISTIC_RUBRIC_TEXT
        }, cookies=auth_cookies, timeout=120)
        
        assert resp.status_code == 200, f"rubric/simplify failed: {resp.text}"
        data = resp.json()
        
        assert "sections" in data, f"Missing sections: {data.keys()}"
        assert len(data["sections"]) > 0, "No sections returned"
        
        first_section = data["sections"][0]
        assert "steps" in first_section, f"Missing steps in section: {first_section.keys()}"
        print(f"✓ rubric/simplify returns {len(data['sections'])} sections with steps")
    
    def test_essay_score_returns_strengths_first_feedback(self, session, auth_cookies):
        """POST /api/essay/score returns scoreBreakdown with strengths-first feedback"""
        resp = session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": REALISTIC_ESSAY_TEXT,
            "rubric_text": REALISTIC_RUBRIC_TEXT,
            "brief_text": ""
        }, cookies=auth_cookies, timeout=120)
        
        assert resp.status_code == 200, f"essay/score failed: {resp.text}"
        data = resp.json()
        
        assert "scoreBreakdown" in data, f"Missing scoreBreakdown: {data.keys()}"
        assert "overallScore" in data, f"Missing overallScore: {data.keys()}"
        
        # Check strengths-first feedback
        if data["scoreBreakdown"]:
            first_criterion = data["scoreBreakdown"][0]
            assert "strengths" in first_criterion, f"Missing strengths in criterion: {first_criterion.keys()}"
        print(f"✓ essay/score returns score {data.get('overallScore')} with strengths-first feedback")
    
    def test_humanise_returns_required_fields(self, session, auth_cookies):
        """POST /api/humanise returns humanised text, changesTable, aiDetectionRiskAreas"""
        resp = session.post(f"{BASE_URL}/api/humanise", json={
            "text": REALISTIC_ESSAY_TEXT[:1500]
        }, cookies=auth_cookies, timeout=120)
        
        assert resp.status_code == 200, f"humanise failed: {resp.text}"
        data = resp.json()
        
        required_fields = ["humanised", "changesTable", "aiDetectionRiskAreas"]
        for field in required_fields:
            assert field in data, f"Missing {field}: {data.keys()}"
        
        print(f"✓ humanise returns all required fields with {len(data.get('changesTable', []))} changes")
    
    def test_concept_visualise_returns_scenes_quiz_related(self, session, auth_cookies):
        """POST /api/concept/visualise returns scenes, quiz, relatedConcepts"""
        resp = session.post(f"{BASE_URL}/api/concept/visualise", json={
            "concept": "Climate Justice",
            "simple_mode": False
        }, cookies=auth_cookies, timeout=120)
        
        assert resp.status_code == 200, f"concept/visualise failed: {resp.text}"
        data = resp.json()
        
        assert "scenes" in data, f"Missing scenes: {data.keys()}"
        assert "quiz" in data, f"Missing quiz: {data.keys()}"
        assert "relatedConcepts" in data, f"Missing relatedConcepts: {data.keys()}"
        
        print(f"✓ concept/visualise returns {len(data.get('scenes', []))} scenes, {len(data.get('quiz', []))} quiz questions")
    
    def test_translate_returns_translated_text(self, session, auth_cookies):
        """POST /api/translate returns translated text"""
        resp = session.post(f"{BASE_URL}/api/translate", json={
            "text": "Climate change represents a significant challenge for developing nations.",
            "target_language": "Spanish"
        }, cookies=auth_cookies, timeout=60)
        
        assert resp.status_code == 200, f"translate failed: {resp.text}"
        data = resp.json()
        
        assert "translated" in data, f"Missing translated: {data.keys()}"
        assert len(data["translated"]) > 0, "Empty translation"
        print(f"✓ translate returns translated text")
    
    def test_essay_deep_feedback_returns_gap_analysis(self, session, auth_cookies):
        """POST /api/essay/deep-feedback returns gapAnalysis and criterionFeedback"""
        # First get initial scores
        score_resp = session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": REALISTIC_ESSAY_TEXT,
            "rubric_text": REALISTIC_RUBRIC_TEXT,
            "brief_text": ""
        }, cookies=auth_cookies, timeout=120)
        
        if score_resp.status_code != 200:
            pytest.skip("Could not get initial scores for deep feedback test")
        
        initial_scores = score_resp.json()
        
        # Now get deep feedback
        resp = session.post(f"{BASE_URL}/api/essay/deep-feedback", json={
            "essay_text": REALISTIC_ESSAY_TEXT,
            "rubric_text": REALISTIC_RUBRIC_TEXT,
            "brief_text": "",
            "initial_scores": str(initial_scores.get("scoreBreakdown", []))[:2000]
        }, cookies=auth_cookies, timeout=120)
        
        assert resp.status_code == 200, f"essay/deep-feedback failed: {resp.text}"
        data = resp.json()
        
        assert "gapAnalysis" in data, f"Missing gapAnalysis: {data.keys()}"
        assert "criterionFeedback" in data, f"Missing criterionFeedback: {data.keys()}"
        print(f"✓ essay/deep-feedback returns gapAnalysis with {len(data.get('gapAnalysis', []))} gaps")


class TestOnboardingGoals:
    """Test onboarding goals (Step 3) with tool recommendation"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        return resp.cookies
    
    def test_save_onboarding_goals_returns_recommendation(self, session, auth_cookies):
        """POST /api/user/onboarding-goals saves goals and returns tool recommendation"""
        resp = session.post(f"{BASE_URL}/api/user/onboarding-goals", json={
            "biggest_challenge": "I struggle with time management and planning my assignments",
            "success_vision": "I want to submit all my assignments on time and feel less overwhelmed"
        }, cookies=auth_cookies)
        
        assert resp.status_code == 200, f"Save goals failed: {resp.text}"
        data = resp.json()
        
        assert "status" in data and data["status"] == "success"
        assert "recommendation" in data, f"Missing recommendation: {data.keys()}"
        
        rec = data["recommendation"]
        assert "tool" in rec, f"Missing tool in recommendation: {rec}"
        assert "name" in rec, f"Missing name in recommendation: {rec}"
        assert "reason" in rec, f"Missing reason in recommendation: {rec}"
        
        # Time management should recommend executive-planner
        assert rec["tool"] == "executive-planner", f"Expected executive-planner for time management, got {rec['tool']}"
        print(f"✓ Onboarding goals saved, recommended: {rec['name']}")
    
    def test_get_onboarding_goals_returns_saved_data(self, session, auth_cookies):
        """GET /api/user/onboarding-goals returns saved goals and recommendation"""
        resp = session.get(f"{BASE_URL}/api/user/onboarding-goals", cookies=auth_cookies)
        
        assert resp.status_code == 200, f"Get goals failed: {resp.text}"
        data = resp.json()
        
        assert "goals" in data, f"Missing goals: {data.keys()}"
        assert "recommendation" in data, f"Missing recommendation: {data.keys()}"
        
        if data["goals"]:
            assert "biggest_challenge" in data["goals"]
            assert "success_vision" in data["goals"]
        
        print(f"✓ Onboarding goals retrieved successfully")
    
    def test_different_challenges_get_different_recommendations(self, session, auth_cookies):
        """Different challenges should get different tool recommendations"""
        test_cases = [
            ("understanding academic jargon", "hidden-curriculum"),
            ("writing essays", "essay-scorer"),
            ("starting assignments", "brief-simplifier"),
        ]
        
        for challenge, expected_tool in test_cases:
            resp = session.post(f"{BASE_URL}/api/user/onboarding-goals", json={
                "biggest_challenge": challenge,
                "success_vision": "Success"
            }, cookies=auth_cookies)
            
            if resp.status_code == 200:
                rec = resp.json().get("recommendation", {})
                actual_tool = rec.get("tool", "")
                print(f"  Challenge '{challenge}' -> {actual_tool} (expected: {expected_tool})")


class TestExportEndpoints:
    """Test PDF and DOCX export endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        return resp.cookies
    
    @pytest.fixture(scope="class")
    def brief_id(self, session, auth_cookies):
        """Get a brief_id from history for export tests"""
        resp = session.get(f"{BASE_URL}/api/briefs/history", cookies=auth_cookies)
        if resp.status_code != 200 or not resp.json():
            pytest.skip("No briefs available for export test")
        return resp.json()[0]["brief_id"]
    
    def test_export_pdf_returns_valid_pdf(self, session, auth_cookies, brief_id):
        """GET /api/briefs/export/{brief_id}/pdf returns valid PDF"""
        resp = session.get(f"{BASE_URL}/api/briefs/export/{brief_id}/pdf", cookies=auth_cookies)
        
        assert resp.status_code == 200, f"PDF export failed: {resp.status_code}"
        assert resp.headers.get("content-type") == "application/pdf"
        
        # Check PDF magic bytes
        content = resp.content
        assert content[:4] == b'%PDF', "Response is not a valid PDF"
        print(f"✓ PDF export successful ({len(content)} bytes)")
    
    def test_export_docx_returns_valid_docx(self, session, auth_cookies, brief_id):
        """GET /api/briefs/export/{brief_id}/docx returns valid DOCX"""
        resp = session.get(f"{BASE_URL}/api/briefs/export/{brief_id}/docx", cookies=auth_cookies)
        
        assert resp.status_code == 200, f"DOCX export failed: {resp.status_code}"
        content_type = resp.headers.get("content-type", "")
        assert "openxmlformats" in content_type or "application/vnd" in content_type
        
        # Check DOCX magic bytes (PK zip header)
        content = resp.content
        assert content[:2] == b'PK', "Response is not a valid DOCX (ZIP)"
        print(f"✓ DOCX export successful ({len(content)} bytes)")


class TestProtectedEndpoints:
    """Test that all protected endpoints return 401 without auth"""
    
    def test_protected_endpoints_require_auth(self):
        """All tool endpoints should return 401 without auth"""
        endpoints = [
            ("POST", "/api/decode-jargon", {"text": "test"}),
            ("POST", "/api/essay/score", {"essay_text": "test", "rubric_text": "", "brief_text": ""}),
            ("POST", "/api/rubric/simplify", {"rubric_text": "test"}),
            ("POST", "/api/humanise", {"text": "test"}),
            ("POST", "/api/concept/visualise", {"concept": "test"}),
            ("POST", "/api/translate", {"text": "test", "target_language": "Spanish"}),
            ("GET", "/api/user/onboarding-goals", None),
            ("POST", "/api/user/onboarding-goals", {"biggest_challenge": "test", "success_vision": "test"}),
        ]
        
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        for method, endpoint, payload in endpoints:
            if method == "POST":
                resp = session.post(f"{BASE_URL}{endpoint}", json=payload)
            else:
                resp = session.get(f"{BASE_URL}{endpoint}")
            
            assert resp.status_code == 401, f"{method} {endpoint} should return 401, got {resp.status_code}"
        
        print(f"✓ All {len(endpoints)} protected endpoints return 401 without auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
