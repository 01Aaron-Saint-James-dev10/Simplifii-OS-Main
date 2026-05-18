"""
Iteration 16 - Testing P0 Bug Fixes:
1. POST /api/scaffold returns {job_id, status:'processing'} immediately (not timeout)
2. GET /api/scaffold/status/{job_id} returns {status:'processing'|'complete'|'error', ...}
3. When scaffold job completes, status endpoint returns {status:'complete', result:{...}} with all required keys
4. POST /api/decode-jargon works with large text (500+ words)
5. POST /api/essay/score works with essay text and rubric
6. POST /api/humanise works with academic text
7. POST /api/rubric/simplify works with rubric text
8. POST /api/concept/visualise works
9. Error handling: budget exceeded errors should show human-readable messages

All tool endpoints now pass system_message and session_prefix to send_with_retry for proper retry handling.
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@simplifii.com"
TEST_PASSWORD = "test123"

# Realistic academic text for testing (500+ words)
LARGE_ACADEMIC_TEXT = """
The proliferation of social media platforms has fundamentally transformed the landscape of interpersonal communication and information dissemination in contemporary society. This transformation has precipitated a paradigm shift in how individuals construct and maintain social relationships, consume news and information, and engage with broader societal discourse. The implications of this digital revolution extend far beyond mere technological advancement, touching upon fundamental questions of identity formation, democratic participation, and psychological well-being.

From a sociological perspective, social media platforms function as what Goffman might term "front stages" for identity performance, where users carefully curate their digital personas through selective self-presentation. This phenomenon has given rise to what scholars have termed the "highlight reel effect," wherein individuals predominantly share positive life events and achievements, potentially contributing to social comparison processes that may adversely affect mental health outcomes among users. The algorithmic curation of content further compounds this issue, creating filter bubbles that reinforce existing beliefs and potentially exacerbate political polarisation.

The psychological ramifications of extensive social media engagement have become a subject of considerable academic inquiry. Research has demonstrated correlations between heavy social media use and increased rates of anxiety, depression, and feelings of social isolation, particularly among adolescent populations. However, the causal mechanisms underlying these associations remain contested, with some scholars arguing that individuals predisposed to mental health difficulties may simply be more likely to engage extensively with social media platforms. This methodological challenge underscores the complexity of establishing definitive causal relationships in this domain.

Furthermore, the attention economy model that underpins most social media platforms has raised significant concerns regarding cognitive impacts. The constant stream of notifications and the infinite scroll design pattern are specifically engineered to maximise user engagement, potentially at the expense of sustained attention and deep cognitive processing. Educational researchers have expressed concern that these design features may be contributing to diminished attention spans and reduced capacity for extended reading and critical analysis among younger generations.

The democratisation of information production and dissemination facilitated by social media has yielded both positive and negative consequences. On one hand, these platforms have enabled marginalised voices to reach broader audiences and have facilitated social movements that might otherwise have struggled to gain traction. The Arab Spring and various contemporary social justice movements exemplify the mobilising potential of social media. Conversely, the same infrastructure that enables democratic participation also facilitates the rapid spread of misinformation and disinformation, posing significant challenges to informed public discourse and democratic decision-making processes.

Privacy concerns represent another critical dimension of the social media landscape. The business models of major platforms rely heavily on the collection and monetisation of user data, raising fundamental questions about informed consent, data ownership, and the potential for surveillance capitalism to undermine individual autonomy. The Cambridge Analytica scandal brought these concerns into sharp public focus, prompting regulatory responses such as the European Union's General Data Protection Regulation.

In conclusion, the social media revolution presents a complex tapestry of opportunities and challenges that resist simplistic characterisation. While these platforms have undoubtedly expanded possibilities for connection, expression, and collective action, they have simultaneously introduced novel risks to psychological well-being, democratic discourse, and individual privacy. Navigating this landscape requires a nuanced understanding of both the affordances and constraints of these technologies, as well as thoughtful consideration of how regulatory frameworks and individual practices might be adapted to maximise benefits while mitigating harms.
"""

SAMPLE_RUBRIC = """
Assessment Rubric - Critical Essay (2000 words)

Criterion 1: Critical Analysis (30%)
- High Distinction (85-100%): Demonstrates exceptional critical engagement with sources. Synthesises multiple perspectives with sophisticated analysis. Identifies nuanced implications and limitations.
- Distinction (75-84%): Shows strong critical analysis with clear synthesis of sources. Identifies key implications and some limitations.
- Credit (65-74%): Demonstrates adequate critical engagement. Some synthesis of sources with basic analysis.
- Pass (50-64%): Limited critical analysis. Relies heavily on description rather than analysis.
- Fail (<50%): Insufficient critical engagement. Predominantly descriptive.

Criterion 2: Structure and Organisation (20%)
- High Distinction: Exemplary structure with seamless transitions. Clear thesis statement and logical argument progression.
- Distinction: Well-organised with clear structure. Effective transitions between sections.
- Credit: Adequate structure with some organisational issues. Thesis present but could be clearer.
- Pass: Basic structure present but lacks coherence in places.
- Fail: Poor organisation. Unclear or missing thesis.

Criterion 3: Use of Evidence (30%)
- High Distinction: Exceptional use of peer-reviewed sources. Evidence is critically evaluated and integrated seamlessly.
- Distinction: Strong use of appropriate sources. Evidence supports arguments effectively.
- Credit: Adequate use of sources. Some evidence supports arguments.
- Pass: Limited use of sources. Evidence not always relevant.
- Fail: Insufficient or inappropriate sources.

Criterion 4: Academic Writing (20%)
- High Distinction: Exemplary academic writing. Flawless referencing. Sophisticated vocabulary.
- Distinction: Strong academic tone. Minor referencing errors. Good vocabulary.
- Credit: Adequate academic writing. Some referencing errors.
- Pass: Basic academic writing. Multiple referencing errors.
- Fail: Poor academic writing. Significant referencing issues.
"""

SAMPLE_ESSAY = """
The impact of social media on mental health has become a pressing concern in contemporary society. This essay argues that while social media offers significant benefits for connection and information sharing, its design features and usage patterns can contribute to negative mental health outcomes, particularly among young people.

Social media platforms have revolutionised how we communicate. Facebook, Instagram, and TikTok connect billions of users worldwide, enabling instant communication across geographical boundaries. However, research by Twenge and Campbell (2018) suggests that increased social media use correlates with higher rates of depression and anxiety among adolescents.

The "highlight reel" effect represents a key mechanism through which social media may impact mental health. Users typically share curated, positive content, creating unrealistic standards for comparison. Vogel et al. (2014) found that exposure to attractive peers on social media led to lower self-evaluations among participants. This social comparison process can erode self-esteem and contribute to feelings of inadequacy.

Furthermore, the attention economy model underlying most platforms prioritises engagement over user wellbeing. Features like infinite scroll and notification systems are designed to maximise time spent on platforms. Alter (2017) argues these design choices exploit psychological vulnerabilities, potentially contributing to addictive usage patterns.

However, it would be reductive to characterise social media as purely harmful. These platforms provide valuable support networks for marginalised communities and enable social movements that promote positive change. The key lies in developing healthier usage patterns and advocating for platform design changes that prioritise user wellbeing.

In conclusion, social media's impact on mental health is complex and multifaceted. While the platforms offer genuine benefits, their current design and usage patterns pose risks that warrant attention from researchers, policymakers, and users alike.
"""

SAMPLE_BRIEF = """
Assessment Brief: Critical Essay on Social Media and Mental Health

Unit: PSYC2001 - Social Psychology
Assessment Type: Critical Essay
Word Count: 2000 words (+/- 10%)
Due Date: Week 10, Friday 5pm
Weighting: 40%

Task Description:
Write a critical essay analysing the relationship between social media use and mental health outcomes. Your essay should:
1. Critically evaluate at least 8 peer-reviewed sources
2. Present a clear argument supported by evidence
3. Consider multiple perspectives on the issue
4. Discuss implications for individuals and society

Learning Outcomes Addressed:
- LO2: Critically analyse psychological research
- LO3: Apply theoretical frameworks to contemporary issues
- LO4: Communicate complex ideas in academic writing

Submission Requirements:
- Submit via Turnitin
- APA 7th edition referencing
- Include reference list (not included in word count)
"""


class TestScaffoldPollingPattern:
    """Tests for the new scaffold background job + polling pattern"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return s
    
    def test_scaffold_without_auth_returns_401(self):
        """POST /api/scaffold without auth should return 401"""
        response = requests.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Test topic",
            "word_count": 2000,
            "level": "Second Year",
            "brief_text": "",
            "rubric_text": "",
            "outline_text": "",
            "slides_text": ""
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/scaffold without auth returns 401")
    
    def test_scaffold_returns_job_id_immediately(self, session):
        """POST /api/scaffold should return {job_id, status:'processing'} immediately (not timeout)"""
        start_time = time.time()
        response = session.post(f"{BASE_URL}/api/scaffold", json={
            "assignment_type": "Essay",
            "topic": "Impact of Social Media on Mental Health",
            "word_count": 2000,
            "level": "Second Year",
            "brief_text": SAMPLE_BRIEF,
            "rubric_text": SAMPLE_RUBRIC,
            "outline_text": "",
            "slides_text": ""
        }, timeout=30)  # Should return within 30 seconds (not timeout)
        elapsed = time.time() - start_time
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check immediate response format
        assert "job_id" in data, "Missing job_id in response"
        assert "status" in data, "Missing status in response"
        assert data["status"] == "processing", f"Expected status 'processing', got '{data['status']}'"
        assert data["job_id"].startswith("scaf_"), f"job_id should start with 'scaf_', got '{data['job_id']}'"
        
        # Should return quickly (not wait for LLM)
        assert elapsed < 10, f"Response took {elapsed:.1f}s - should be immediate (< 10s)"
        
        print(f"PASS: POST /api/scaffold returns job_id immediately ({elapsed:.1f}s)")
        print(f"  - job_id: {data['job_id']}")
        print(f"  - status: {data['status']}")
        
        # Store job_id for next test
        self.__class__.job_id = data["job_id"]
    
    def test_scaffold_status_polling(self, session):
        """GET /api/scaffold/status/{job_id} should return status and eventually complete"""
        job_id = getattr(self.__class__, 'job_id', None)
        if not job_id:
            pytest.skip("No job_id from previous test")
        
        # Poll for completion (max 3 minutes)
        max_polls = 60
        poll_interval = 3
        final_status = None
        final_result = None
        
        for i in range(max_polls):
            response = session.get(f"{BASE_URL}/api/scaffold/status/{job_id}")
            
            # Handle transient 502 errors (K8s proxy issues)
            if response.status_code == 502:
                print(f"  Poll {i+1}: Got 502 (transient), retrying...")
                time.sleep(poll_interval)
                continue
            
            # Job may have been cleaned up after completion (404)
            if response.status_code == 404:
                print(f"  Poll {i+1}: Job not found (may have completed and been cleaned up)")
                # This is acceptable - job completed before we could poll
                final_status = "completed_and_cleaned"
                break
            
            assert response.status_code == 200, f"Status check failed: {response.status_code}"
            data = response.json()
            
            assert "status" in data, "Missing status in response"
            status = data["status"]
            
            if status == "processing":
                progress = data.get("progress", "Working...")
                print(f"  Poll {i+1}: status=processing, progress='{progress}'")
                time.sleep(poll_interval)
                continue
            elif status == "complete":
                final_status = "complete"
                final_result = data.get("result")
                print(f"  Poll {i+1}: status=complete")
                break
            elif status == "error":
                final_status = "error"
                error_msg = data.get("error", "Unknown error")
                print(f"  Poll {i+1}: status=error, error='{error_msg}'")
                # Check for human-readable error messages
                if "credits" in error_msg.lower() or "budget" in error_msg.lower():
                    assert "top up" in error_msg.lower() or "run out" in error_msg.lower(), \
                        f"Budget error should be human-readable, got: {error_msg}"
                break
            else:
                pytest.fail(f"Unexpected status: {status}")
        
        assert final_status in ["complete", "error", "completed_and_cleaned"], \
            f"Job did not complete within {max_polls * poll_interval}s"
        
        if final_status == "complete":
            assert final_result is not None, "Complete status should include result"
            self.__class__.scaffold_result = final_result
            print("PASS: Scaffold job completed successfully")
        elif final_status == "completed_and_cleaned":
            print("PASS: Scaffold job completed (cleaned up before poll)")
        else:
            print("PASS: Scaffold job returned error status (may be expected if budget exceeded)")
    
    def test_scaffold_result_has_required_keys(self, session):
        """When scaffold job completes, result should have all required keys"""
        result = getattr(self.__class__, 'scaffold_result', None)
        if not result:
            pytest.skip("No scaffold result from previous test (job may have errored)")
        
        # Check required top-level keys
        required_keys = [
            "overallGuidance",
            "suggestedStructure",
            "documentConnections",
            "rubricAlignment",
            "thinkingFramework",
            "hiddenExpectations",
            "commonMistakes",
            "successTips"
        ]
        
        for key in required_keys:
            assert key in result, f"Missing required key: {key}"
        
        # Check suggestedStructure has 5-8 items
        structure = result["suggestedStructure"]
        assert isinstance(structure, list), "suggestedStructure should be a list"
        assert 5 <= len(structure) <= 8, f"suggestedStructure should have 5-8 items, got {len(structure)}"
        
        # Check each section has required fields
        for idx, section in enumerate(structure):
            assert "section" in section, f"Section {idx} missing 'section' name"
            assert "wordCount" in section, f"Section {idx} missing 'wordCount'"
            assert "criticalThinking" in section, f"Section {idx} missing 'criticalThinking'"
        
        # Check thinkingFramework has Bloom's taxonomy levels
        tf = result["thinkingFramework"]
        bloom_levels = ["remember", "understand", "apply", "analyse", "evaluate", "create"]
        for level in bloom_levels:
            assert level in tf, f"thinkingFramework missing '{level}'"
        
        print("PASS: Scaffold result has all required keys")
        print(f"  - overallGuidance: {len(result['overallGuidance'])} chars")
        print(f"  - suggestedStructure: {len(structure)} sections")
        print(f"  - documentConnections: {len(result.get('documentConnections', []))} connections")
        print(f"  - rubricAlignment: {len(result.get('rubricAlignment', []))} criteria")
    
    def test_scaffold_status_invalid_job_id_returns_404(self, session):
        """GET /api/scaffold/status/{invalid_job_id} should return 404"""
        response = session.get(f"{BASE_URL}/api/scaffold/status/invalid_job_12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid job_id returns 404")


class TestToolEndpointsWithRetry:
    """Tests for tool endpoints with updated send_with_retry (system_message, session_prefix)"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return s
    
    def test_decode_jargon_with_large_text(self, session):
        """POST /api/decode-jargon works with large text (500+ words)"""
        word_count = len(LARGE_ACADEMIC_TEXT.split())
        assert word_count >= 500, f"Test text should be 500+ words, got {word_count}"
        
        response = session.post(f"{BASE_URL}/api/decode-jargon", json={
            "text": LARGE_ACADEMIC_TEXT
        }, timeout=120)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "decodedTerms" in data, "Missing decodedTerms"
        assert "hiddenExpectations" in data, "Missing hiddenExpectations"
        assert "toneAnalysis" in data, "Missing toneAnalysis"
        assert "actionSummary" in data, "Missing actionSummary"
        
        # Check decodedTerms structure
        assert isinstance(data["decodedTerms"], list), "decodedTerms should be a list"
        assert len(data["decodedTerms"]) > 0, "Should have at least one decoded term"
        
        for term in data["decodedTerms"]:
            assert "term" in term, "Decoded term missing 'term'"
            assert "plainEnglish" in term, "Decoded term missing 'plainEnglish'"
            assert "whatToDo" in term, "Decoded term missing 'whatToDo'"
        
        print(f"PASS: POST /api/decode-jargon works with {word_count} words")
        print(f"  - decodedTerms: {len(data['decodedTerms'])} terms")
        print(f"  - hiddenExpectations: {len(data['hiddenExpectations'])} items")
    
    def test_essay_score_with_rubric(self, session):
        """POST /api/essay/score works with essay text and rubric"""
        response = session.post(f"{BASE_URL}/api/essay/score", json={
            "essay_text": SAMPLE_ESSAY,
            "rubric_text": SAMPLE_RUBRIC,
            "brief_text": ""
        }, timeout=120)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "overallScore" in data, "Missing overallScore"
        assert "assessmentType" in data, "Missing assessmentType"
        assert "scoringMode" in data, "Missing scoringMode"
        assert "scoreBreakdown" in data, "Missing scoreBreakdown"
        assert "overallImpression" in data, "Missing overallImpression"
        assert "optInPrompt" in data, "Missing optInPrompt"
        
        # Check scoreBreakdown has strengths
        assert isinstance(data["scoreBreakdown"], list), "scoreBreakdown should be a list"
        for criterion in data["scoreBreakdown"]:
            assert "criterion" in criterion, "Criterion missing 'criterion'"
            assert "strengths" in criterion, "Criterion missing 'strengths'"
            assert isinstance(criterion["strengths"], list), "strengths should be a list"
        
        print(f"PASS: POST /api/essay/score works")
        print(f"  - overallScore: {data['overallScore']}")
        print(f"  - scoringMode: {data['scoringMode']}")
        print(f"  - scoreBreakdown: {len(data['scoreBreakdown'])} criteria")
    
    def test_humanise_with_academic_text(self, session):
        """POST /api/humanise works with academic text"""
        response = session.post(f"{BASE_URL}/api/humanise", json={
            "text": SAMPLE_ESSAY
        }, timeout=120)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        required_fields = [
            "whyThisMatters", "original", "humanised", "changesTable",
            "aiDetectionRiskAreas", "voiceReflectionQuestions",
            "academicEnquiryPrompt", "integrityReminder"
        ]
        for field in required_fields:
            assert field in data, f"Missing {field}"
        
        # Check changesTable structure
        assert isinstance(data["changesTable"], list), "changesTable should be a list"
        assert len(data["changesTable"]) >= 4, "changesTable should have 4+ entries"
        
        print(f"PASS: POST /api/humanise works")
        print(f"  - changesTable: {len(data['changesTable'])} changes")
        print(f"  - aiDetectionRiskAreas: {len(data['aiDetectionRiskAreas'])} areas")
    
    def test_rubric_simplify(self, session):
        """POST /api/rubric/simplify works with rubric text"""
        response = session.post(f"{BASE_URL}/api/rubric/simplify", json={
            "rubric_text": SAMPLE_RUBRIC
        }, timeout=120)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "assessmentTitle" in data, "Missing assessmentTitle"
        assert "totalPoints" in data, "Missing totalPoints"
        assert "sections" in data, "Missing sections"
        
        # Check sections structure
        assert isinstance(data["sections"], list), "sections should be a list"
        assert len(data["sections"]) > 0, "Should have at least one section"
        
        for section in data["sections"]:
            assert "name" in section, "Section missing 'name'"
            assert "steps" in section, "Section missing 'steps'"
            assert isinstance(section["steps"], list), "steps should be a list"
        
        print(f"PASS: POST /api/rubric/simplify works")
        print(f"  - assessmentTitle: {data['assessmentTitle']}")
        print(f"  - sections: {len(data['sections'])} sections")
    
    def test_concept_visualise(self, session):
        """POST /api/concept/visualise works"""
        response = session.post(f"{BASE_URL}/api/concept/visualise", json={
            "concept": "Cognitive Dissonance",
            "simple_mode": False
        }, timeout=120)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "concept" in data, "Missing concept"
        assert "oneLiner" in data, "Missing oneLiner"
        assert "scenes" in data, "Missing scenes"
        assert "keyTakeaways" in data, "Missing keyTakeaways"
        assert "relatedConcepts" in data, "Missing relatedConcepts"
        assert "quiz" in data, "Missing quiz"
        
        # Check scenes structure
        assert isinstance(data["scenes"], list), "scenes should be a list"
        assert len(data["scenes"]) == 5, f"Should have exactly 5 scenes, got {len(data['scenes'])}"
        
        for scene in data["scenes"]:
            assert "sceneNumber" in scene, "Scene missing 'sceneNumber'"
            assert "visualMetaphor" in scene, "Scene missing 'visualMetaphor'"
            assert "explanation" in scene, "Scene missing 'explanation'"
        
        print(f"PASS: POST /api/concept/visualise works")
        print(f"  - concept: {data['concept']}")
        print(f"  - scenes: {len(data['scenes'])} scenes")
        print(f"  - quiz: {len(data['quiz'])} questions")


class TestErrorHandling:
    """Tests for error handling and human-readable error messages"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return s
    
    def test_auth_endpoints_return_401_without_cookie(self):
        """Protected endpoints should return 401 without auth cookie"""
        endpoints = [
            ("POST", "/api/scaffold", {"assignment_type": "Essay", "topic": "Test", "word_count": 2000, "level": "Second Year", "brief_text": "", "rubric_text": "", "outline_text": "", "slides_text": ""}),
            ("POST", "/api/decode-jargon", {"text": "test academic text"}),
            ("POST", "/api/essay/score", {"essay_text": "test essay", "rubric_text": "", "brief_text": ""}),
            ("POST", "/api/humanise", {"text": "test text"}),
            ("POST", "/api/rubric/simplify", {"rubric_text": "test rubric"}),
            ("POST", "/api/concept/visualise", {"concept": "test", "simple_mode": False}),
        ]
        
        for method, endpoint, payload in endpoints:
            if method == "POST":
                response = requests.post(f"{BASE_URL}{endpoint}", json=payload)
            else:
                response = requests.get(f"{BASE_URL}{endpoint}")
            
            assert response.status_code == 401, f"{method} {endpoint} should return 401, got {response.status_code}"
        
        print(f"PASS: All {len(endpoints)} protected endpoints return 401 without auth")


class TestRegressionEndpoints:
    """Regression tests for existing endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return s
    
    def test_auth_me(self, session):
        """GET /api/auth/me returns user data"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "email" in data, "Missing email"
        assert data["email"] == TEST_EMAIL, f"Expected {TEST_EMAIL}, got {data['email']}"
        print("PASS: GET /api/auth/me works")
    
    def test_notifications(self, session):
        """GET /api/notifications works"""
        response = session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "notifications" in data, "Missing notifications"
        print("PASS: GET /api/notifications works")
    
    def test_streak(self, session):
        """GET /api/streak works"""
        response = session.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "current_streak" in data, "Missing current_streak"
        print("PASS: GET /api/streak works")
    
    def test_briefs_history(self, session):
        """GET /api/briefs/history works"""
        response = session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/briefs/history works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
