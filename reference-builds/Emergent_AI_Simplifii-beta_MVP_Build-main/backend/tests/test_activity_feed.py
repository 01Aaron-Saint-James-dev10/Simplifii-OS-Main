"""
Test Activity Feed Feature - Iteration 11
Tests the new public /api/activity/feed endpoint that provides anonymised
recent student activity for social proof on the dashboard.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestActivityFeedEndpoint:
    """Tests for GET /api/activity/feed - PUBLIC endpoint (no auth required)"""

    def test_activity_feed_returns_200_without_auth(self):
        """Activity feed is public - should return 200 without authentication"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Activity feed returns 200 without auth")

    def test_activity_feed_returns_feed_array(self):
        """Response should contain 'feed' key with array value"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        assert "feed" in data, "Response missing 'feed' key"
        assert isinstance(data["feed"], list), "'feed' should be an array"
        print(f"✅ Feed array returned with {len(data['feed'])} items")

    def test_activity_feed_max_12_items(self):
        """Feed should return maximum 12 items"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["feed"]) <= 12, f"Feed has {len(data['feed'])} items, max should be 12"
        print(f"✅ Feed respects max 12 items limit ({len(data['feed'])} items)")

    def test_activity_feed_item_structure(self):
        """Each feed item should have required fields: message, tool, type, created_at, time_ago"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["feed"]) == 0:
            pytest.skip("No feed items to test structure")
        
        required_fields = ["message", "tool", "type", "created_at", "time_ago"]
        for idx, item in enumerate(data["feed"][:3]):  # Check first 3 items
            for field in required_fields:
                assert field in item, f"Item {idx} missing '{field}' field"
                assert item[field] is not None, f"Item {idx} has null '{field}'"
        
        print("✅ Feed items have all required fields (message, tool, type, created_at, time_ago)")

    def test_activity_feed_message_is_string(self):
        """Message field should be a non-empty string"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["feed"]) == 0:
            pytest.skip("No feed items to test")
        
        for idx, item in enumerate(data["feed"][:3]):
            assert isinstance(item["message"], str), f"Item {idx} message is not a string"
            assert len(item["message"]) > 0, f"Item {idx} message is empty"
        
        print("✅ Feed messages are non-empty strings")

    def test_activity_feed_tool_values(self):
        """Tool field should be valid tool type (brief, checkin, etc.)"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["feed"]) == 0:
            pytest.skip("No feed items to test")
        
        valid_tools = ["brief", "checkin", "rubric", "essay", "humanise", "scaffold", "concept", "planner", "jargon"]
        for idx, item in enumerate(data["feed"]):
            assert item["tool"] in valid_tools, f"Item {idx} has invalid tool: {item['tool']}"
        
        print("✅ All feed items have valid tool types")

    def test_activity_feed_time_ago_format(self):
        """time_ago should be human-readable relative time (e.g., '3h ago', 'just now')"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["feed"]) == 0:
            pytest.skip("No feed items to test")
        
        valid_patterns = ["just now", "ago", "recently"]
        for idx, item in enumerate(data["feed"][:3]):
            time_ago = item["time_ago"]
            assert any(p in time_ago for p in valid_patterns), f"Item {idx} has invalid time_ago: {time_ago}"
        
        print("✅ time_ago fields have valid relative time format")

    def test_activity_feed_sorted_by_recent(self):
        """Feed items should be sorted by most recent first"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["feed"]) < 2:
            pytest.skip("Need at least 2 items to test sorting")
        
        # Check that created_at timestamps are in descending order
        from datetime import datetime
        timestamps = []
        for item in data["feed"]:
            try:
                ts = datetime.fromisoformat(item["created_at"].replace('Z', '+00:00'))
                timestamps.append(ts)
            except (ValueError, TypeError):
                pass
        
        if len(timestamps) >= 2:
            for i in range(len(timestamps) - 1):
                assert timestamps[i] >= timestamps[i + 1], "Feed not sorted by most recent first"
        
        print("✅ Feed is sorted by most recent first")

    def test_activity_feed_anonymised_no_emails(self):
        """Messages should NOT contain email addresses"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        import re
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
        for idx, item in enumerate(data["feed"]):
            message = item["message"]
            emails_found = re.findall(email_pattern, message)
            assert len(emails_found) == 0, f"Item {idx} contains email: {emails_found}"
        
        print("✅ Feed messages are anonymised (no emails)")

    def test_activity_feed_anonymised_no_user_ids(self):
        """Messages should NOT contain user IDs (user_xxxxx pattern)"""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        import re
        user_id_pattern = r'user_[a-zA-Z0-9]+'
        
        for idx, item in enumerate(data["feed"]):
            message = item["message"]
            ids_found = re.findall(user_id_pattern, message)
            assert len(ids_found) == 0, f"Item {idx} contains user_id: {ids_found}"
        
        print("✅ Feed messages are anonymised (no user IDs)")

    def test_activity_feed_uses_anonymous_prefixes(self):
        """Messages should use anonymous prefixes like 'A student', 'Someone', etc."""
        response = requests.get(f"{BASE_URL}/api/activity/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["feed"]) == 0:
            pytest.skip("No feed items to test")
        
        anonymous_prefixes = ["A student", "Someone", "A learner", "A fellow student"]
        
        for idx, item in enumerate(data["feed"][:5]):
            message = item["message"]
            has_prefix = any(message.startswith(prefix) for prefix in anonymous_prefixes)
            assert has_prefix, f"Item {idx} doesn't start with anonymous prefix: {message[:50]}"
        
        print("✅ Feed messages use anonymous prefixes")


class TestExistingEndpointsStillWork:
    """Regression tests to ensure existing endpoints still work after activity feed addition"""

    def test_login_still_works(self):
        """Login endpoint should still work"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@simplifii.com"
        print("✅ Login endpoint still works")

    def test_notifications_endpoint_requires_auth(self):
        """Notifications endpoint should still require auth"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Notifications endpoint still requires auth")

    def test_notifications_with_auth(self):
        """Notifications endpoint should work with auth"""
        session = requests.Session()
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@simplifii.com", "password": "test123"}
        )
        assert login_resp.status_code == 200
        
        notif_resp = session.get(f"{BASE_URL}/api/notifications")
        assert notif_resp.status_code == 200
        data = notif_resp.json()
        assert "notifications" in data
        print(f"✅ Notifications endpoint works with auth ({len(data['notifications'])} notifications)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
