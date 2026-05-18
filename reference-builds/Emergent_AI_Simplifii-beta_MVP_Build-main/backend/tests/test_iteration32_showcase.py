"""
Iteration 32 - Video Showcase Feature Tests
Tests for GET /api/showcase/videos (public) and PUT /api/showcase/videos/:id (owner-only)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestShowcaseVideosPublic:
    """Test public GET /api/showcase/videos endpoint"""
    
    def test_get_showcase_videos_returns_200(self):
        """GET /api/showcase/videos should return 200 without auth"""
        response = requests.get(f"{BASE_URL}/api/showcase/videos")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_showcase_videos_returns_3_videos(self):
        """GET /api/showcase/videos should return exactly 3 videos"""
        response = requests.get(f"{BASE_URL}/api/showcase/videos")
        data = response.json()
        assert "videos" in data, "Response should have 'videos' key"
        assert len(data["videos"]) == 3, f"Expected 3 videos, got {len(data['videos'])}"
    
    def test_get_showcase_videos_structure(self):
        """Each video should have required fields"""
        response = requests.get(f"{BASE_URL}/api/showcase/videos")
        data = response.json()
        for video in data["videos"]:
            assert "id" in video, "Video should have 'id'"
            assert "title" in video, "Video should have 'title'"
            assert "description" in video, "Video should have 'description'"
            assert "duration" in video, "Video should have 'duration'"
            assert "video_url" in video, "Video should have 'video_url'"
            assert "position" in video, "Video should have 'position'"


class TestShowcaseVideosOwnerOnly:
    """Test PUT /api/showcase/videos/:id requires owner auth"""
    
    @pytest.fixture
    def non_owner_session(self):
        """Login as non-owner test user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@simplifii.com",
            "password": "test123"
        })
        if response.status_code != 200:
            pytest.skip("Could not login as test user")
        return session
    
    def test_put_showcase_video_without_auth_returns_401(self):
        """PUT /api/showcase/videos/:id without auth should return 401"""
        response = requests.put(
            f"{BASE_URL}/api/showcase/videos/placeholder-0",
            json={"video_url": "https://youtube.com/test"}
        )
        # Could be 401 or 403 depending on implementation
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_put_showcase_video_non_owner_returns_403(self, non_owner_session):
        """PUT /api/showcase/videos/:id as non-owner should return 403"""
        response = non_owner_session.put(
            f"{BASE_URL}/api/showcase/videos/placeholder-0",
            json={"video_url": "https://youtube.com/test"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "Owner only" in data.get("detail", ""), "Should return 'Owner only' message"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
