"""
Iteration 12 - Testing 6 new features:
1. Streak System (GET /api/streak)
2. Weekly Digest (GET /api/digest/weekly)
3. Shareable Progress Cards (GET /api/share/card/{brief_id})
4. Neurotype-specific UI (GET /api/user/neurotype-ui)
5. University Intelligence (GET /api/university/intel)
6. Existing endpoints still work (activity/feed, auth, notifications)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests - verify login still works"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_login_success(self, session):
        """POST /api/auth/login with valid credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        assert "name" in data
        print(f"✓ Login successful: {data['name']}")


class TestStreakEndpoint:
    """GET /api/streak - Streak System tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return session
    
    def test_streak_returns_200(self, auth_session):
        """GET /api/streak returns 200 with auth"""
        response = auth_session.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 200
        print("✓ Streak endpoint returns 200")
    
    def test_streak_has_required_fields(self, auth_session):
        """Streak response has current_streak, longest_streak, checked_in_today, streak_dates"""
        response = auth_session.get(f"{BASE_URL}/api/streak")
        data = response.json()
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "checked_in_today" in data
        assert "streak_dates" in data
        print(f"✓ Streak data: current={data['current_streak']}, longest={data['longest_streak']}, checked_in_today={data['checked_in_today']}")
    
    def test_streak_dates_has_14_items(self, auth_session):
        """streak_dates array has exactly 14 items (14-day heatmap)"""
        response = auth_session.get(f"{BASE_URL}/api/streak")
        data = response.json()
        assert len(data["streak_dates"]) == 14
        print("✓ streak_dates has 14 items for heatmap")
    
    def test_streak_dates_format(self, auth_session):
        """Each streak_date item has date and active fields"""
        response = auth_session.get(f"{BASE_URL}/api/streak")
        data = response.json()
        for item in data["streak_dates"]:
            assert "date" in item
            assert "active" in item
            assert isinstance(item["active"], bool)
        print("✓ streak_dates items have correct format (date, active)")
    
    def test_streak_requires_auth(self):
        """GET /api/streak without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 401
        print("✓ Streak endpoint requires authentication")


class TestWeeklyDigestEndpoint:
    """GET /api/digest/weekly - Weekly Digest tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return session
    
    def test_digest_returns_200(self, auth_session):
        """GET /api/digest/weekly returns 200 with auth"""
        response = auth_session.get(f"{BASE_URL}/api/digest/weekly")
        assert response.status_code == 200
        print("✓ Weekly digest endpoint returns 200")
    
    def test_digest_has_required_fields(self, auth_session):
        """Digest response has period, new_briefs, briefs_progress, mood_summary, motivational_message"""
        response = auth_session.get(f"{BASE_URL}/api/digest/weekly")
        data = response.json()
        assert "period" in data
        assert "new_briefs" in data
        assert "briefs_progress" in data
        assert "mood_summary" in data
        assert "motivational_message" in data
        print(f"✓ Digest period: {data['period']}")
        print(f"✓ Motivational message: {data['motivational_message'][:50]}...")
    
    def test_digest_mood_summary_structure(self, auth_session):
        """mood_summary has great, okay, struggling, overwhelmed counts"""
        response = auth_session.get(f"{BASE_URL}/api/digest/weekly")
        data = response.json()
        mood = data["mood_summary"]
        assert "great" in mood
        assert "okay" in mood
        assert "struggling" in mood
        assert "overwhelmed" in mood
        print(f"✓ Mood summary: great={mood['great']}, okay={mood['okay']}, struggling={mood['struggling']}, overwhelmed={mood['overwhelmed']}")
    
    def test_digest_briefs_progress_structure(self, auth_session):
        """briefs_progress items have title, brief_id, progress_pct, tasks_done, tasks_total"""
        response = auth_session.get(f"{BASE_URL}/api/digest/weekly")
        data = response.json()
        if len(data["briefs_progress"]) > 0:
            brief = data["briefs_progress"][0]
            assert "title" in brief
            assert "brief_id" in brief
            assert "progress_pct" in brief
            assert "tasks_done" in brief
            assert "tasks_total" in brief
            print(f"✓ Brief progress example: {brief['title']} - {brief['progress_pct']}%")
        else:
            print("✓ No briefs in progress (empty array is valid)")
    
    def test_digest_requires_auth(self):
        """GET /api/digest/weekly without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/digest/weekly")
        assert response.status_code == 401
        print("✓ Weekly digest endpoint requires authentication")


class TestShareCardEndpoint:
    """GET /api/share/card/{brief_id} - Shareable Progress Card tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return session
    
    @pytest.fixture(scope="class")
    def valid_brief_id(self, auth_session):
        """Get a valid brief_id from briefs history"""
        response = auth_session.get(f"{BASE_URL}/api/briefs/history")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]["brief_id"]
        pytest.skip("No briefs available for testing share card")
    
    def test_share_card_returns_200(self, auth_session, valid_brief_id):
        """GET /api/share/card/{brief_id} returns 200 with valid brief"""
        response = auth_session.get(f"{BASE_URL}/api/share/card/{valid_brief_id}")
        assert response.status_code == 200
        print(f"✓ Share card endpoint returns 200 for brief {valid_brief_id}")
    
    def test_share_card_has_required_fields(self, auth_session, valid_brief_id):
        """Share card response has title, progress_pct, badges, share_text"""
        response = auth_session.get(f"{BASE_URL}/api/share/card/{valid_brief_id}")
        data = response.json()
        assert "title" in data
        assert "progress_pct" in data
        assert "badges" in data
        assert "share_text" in data
        print(f"✓ Share card: {data['title']} - {data['progress_pct']}%")
        print(f"✓ Share text: {data['share_text']}")
    
    def test_share_card_badges_structure(self, auth_session, valid_brief_id):
        """badges is an array (can be empty)"""
        response = auth_session.get(f"{BASE_URL}/api/share/card/{valid_brief_id}")
        data = response.json()
        assert isinstance(data["badges"], list)
        if len(data["badges"]) > 0:
            badge = data["badges"][0]
            assert "name" in badge
            assert "icon" in badge
            assert "colour" in badge
            print(f"✓ Badge example: {badge['name']} ({badge['icon']})")
        else:
            print("✓ No badges earned yet (empty array is valid)")
    
    def test_share_card_invalid_brief_returns_404(self, auth_session):
        """GET /api/share/card/invalid_id returns 404"""
        response = auth_session.get(f"{BASE_URL}/api/share/card/invalid_brief_id_12345")
        assert response.status_code == 404
        print("✓ Share card returns 404 for invalid brief_id")
    
    def test_share_card_requires_auth(self, valid_brief_id):
        """GET /api/share/card/{brief_id} without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/share/card/{valid_brief_id}")
        assert response.status_code == 401
        print("✓ Share card endpoint requires authentication")


class TestNeurotypeUIEndpoint:
    """GET /api/user/neurotype-ui - Neurotype-specific UI tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return session
    
    def test_neurotype_ui_returns_200(self, auth_session):
        """GET /api/user/neurotype-ui returns 200 with auth"""
        response = auth_session.get(f"{BASE_URL}/api/user/neurotype-ui")
        assert response.status_code == 200
        print("✓ Neurotype UI endpoint returns 200")
    
    def test_neurotype_ui_has_required_fields(self, auth_session):
        """Response has neurotype and ui_config"""
        response = auth_session.get(f"{BASE_URL}/api/user/neurotype-ui")
        data = response.json()
        assert "neurotype" in data
        assert "ui_config" in data
        print(f"✓ Neurotype: {data['neurotype']}")
    
    def test_neurotype_ui_config_structure(self, auth_session):
        """ui_config has label, spacing, tips"""
        response = auth_session.get(f"{BASE_URL}/api/user/neurotype-ui")
        data = response.json()
        config = data["ui_config"]
        assert "label" in config
        assert "spacing" in config
        assert "tips" in config
        assert isinstance(config["tips"], list)
        print(f"✓ UI Config: {config['label']}, spacing={config['spacing']}")
        print(f"✓ Tips count: {len(config['tips'])}")
    
    def test_neurotype_ui_requires_auth(self):
        """GET /api/user/neurotype-ui without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/user/neurotype-ui")
        assert response.status_code == 401
        print("✓ Neurotype UI endpoint requires authentication")


class TestUniversityIntelEndpoint:
    """GET /api/university/intel - University Intelligence tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return session
    
    def test_university_intel_returns_200(self, auth_session):
        """GET /api/university/intel returns 200 with auth"""
        response = auth_session.get(f"{BASE_URL}/api/university/intel")
        assert response.status_code == 200
        print("✓ University intel endpoint returns 200")
    
    def test_university_intel_has_required_fields(self, auth_session):
        """Response has university, grading, tips, referencing"""
        response = auth_session.get(f"{BASE_URL}/api/university/intel")
        data = response.json()
        assert "university" in data
        assert "grading" in data
        assert "tips" in data
        assert "referencing" in data
        print(f"✓ University: {data['university']}")
        print(f"✓ Grading: {data['grading']}")
    
    def test_university_intel_tips_is_array(self, auth_session):
        """tips is an array of strings"""
        response = auth_session.get(f"{BASE_URL}/api/university/intel")
        data = response.json()
        assert isinstance(data["tips"], list)
        assert len(data["tips"]) > 0
        assert isinstance(data["tips"][0], str)
        print(f"✓ Tips count: {len(data['tips'])}")
    
    def test_university_intel_requires_auth(self):
        """GET /api/university/intel without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/university/intel")
        assert response.status_code == 401
        print("✓ University intel endpoint requires authentication")


class TestExistingEndpoints:
    """Verify existing endpoints still work"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        return session
    
    def test_activity_feed_public(self):
        """GET /api/activity/feed works without auth (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        assert "feed" in data
        assert isinstance(data["feed"], list)
        print(f"✓ Activity feed returns {len(data['feed'])} items (public)")
    
    def test_notifications_with_auth(self, auth_session):
        """GET /api/notifications works with auth"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        print(f"✓ Notifications returns {len(data['notifications'])} items")
    
    def test_notifications_requires_auth(self):
        """GET /api/notifications without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("✓ Notifications endpoint requires authentication")
    
    def test_briefs_history_with_auth(self, auth_session):
        """GET /api/briefs/history works with auth"""
        response = auth_session.get(f"{BASE_URL}/api/briefs/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Briefs history returns {len(data)} briefs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
