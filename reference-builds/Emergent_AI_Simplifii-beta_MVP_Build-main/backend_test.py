#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime
import tempfile
import os

class SimplifiiAPITester:
    def __init__(self, base_url="https://udl-magic.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def test_auth_register(self):
        """Test user registration"""
        try:
            # Use timestamp to ensure unique email
            timestamp = int(time.time())
            test_email = f"test2+{timestamp}@simplifii.com"
            
            response = requests.post(f"{self.api_url}/auth/register", 
                json={
                    "email": test_email,
                    "password": "test123",
                    "name": "Test User 2"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("email") == test_email and user_data.get("credits") == 1:
                    self.log_test("User Registration", True, f"Registered {test_email}")
                    return True
                else:
                    self.log_test("User Registration", False, f"Invalid response data: {user_data}")
            else:
                self.log_test("User Registration", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_login(self):
        """Test user login with existing credentials"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                json={
                    "email": "test@simplifii.com",
                    "password": "test123"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                self.user_data = response.json()
                # Extract session token from cookies
                session_cookie = response.cookies.get('session_token')
                if session_cookie:
                    self.session_token = session_cookie
                    self.log_test("User Login", True, f"Logged in as {self.user_data.get('name')}")
                    return True
                else:
                    self.log_test("User Login", False, "No session token in response")
            else:
                self.log_test("User Login", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_me(self):
        """Test getting current user data"""
        if not self.session_token:
            self.log_test("Get Current User", False, "No session token available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/auth/me",
                cookies={'session_token': self.session_token},
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("email") and user_data.get("user_id"):
                    self.log_test("Get Current User", True, f"Retrieved user: {user_data.get('email')}")
                    return True
                else:
                    self.log_test("Get Current User", False, f"Invalid user data: {user_data}")
            else:
                self.log_test("Get Current User", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
        
        return False

    def test_credit_balance(self):
        """Test getting credit balance"""
        if not self.session_token:
            self.log_test("Get Credit Balance", False, "No session token available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/credits/balance",
                cookies={'session_token': self.session_token},
                timeout=10
            )
            
            if response.status_code == 200:
                balance_data = response.json()
                if "credits" in balance_data:
                    self.log_test("Get Credit Balance", True, f"Credits: {balance_data['credits']}")
                    return True
                else:
                    self.log_test("Get Credit Balance", False, f"Invalid response: {balance_data}")
            else:
                self.log_test("Get Credit Balance", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Credit Balance", False, f"Exception: {str(e)}")
        
        return False

    def test_credit_purchase_initiation(self):
        """Test initiating credit purchase (Stripe checkout)"""
        if not self.session_token:
            self.log_test("Credit Purchase Initiation", False, "No session token available")
            return False
            
        try:
            form_data = {
                'package_id': 'small',
                'origin_url': self.base_url
            }
            
            response = requests.post(f"{self.api_url}/credits/purchase",
                data=form_data,
                cookies={'session_token': self.session_token},
                timeout=10
            )
            
            if response.status_code == 200:
                purchase_data = response.json()
                if purchase_data.get("url") and purchase_data.get("session_id"):
                    self.log_test("Credit Purchase Initiation", True, "Stripe checkout URL generated")
                    return True
                else:
                    self.log_test("Credit Purchase Initiation", False, f"Invalid response: {purchase_data}")
            else:
                self.log_test("Credit Purchase Initiation", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Credit Purchase Initiation", False, f"Exception: {str(e)}")
        
        return False

    def create_test_pdf(self):
        """Create a simple test PDF file"""
        try:
            # Create a simple text file that we'll treat as PDF for testing
            test_content = """
            Assessment Brief: Marketing Strategy Essay
            
            Due Date: Week 12
            Word Count: 2000 words
            
            Task: Analyze the marketing strategy of a chosen company and provide recommendations.
            
            Requirements:
            1. Company analysis
            2. Market research
            3. Strategic recommendations
            4. Academic references (minimum 10)
            
            Marking Criteria:
            - Analysis depth (30%)
            - Research quality (25%)
            - Recommendations (25%)
            - Presentation (20%)
            """
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False)
            temp_file.write(test_content)
            temp_file.close()
            
            return temp_file.name
            
        except Exception as e:
            print(f"Failed to create test PDF: {e}")
            return None

    def test_brief_upload(self):
        """Test brief upload and processing"""
        if not self.session_token:
            self.log_test("Brief Upload", False, "No session token available")
            return False
            
        # Create test file
        test_file_path = self.create_test_pdf()
        if not test_file_path:
            self.log_test("Brief Upload", False, "Could not create test file")
            return False
            
        try:
            with open(test_file_path, 'rb') as f:
                files = {'files': ('test_brief.pdf', f, 'application/pdf')}
                data = {
                    'assessment_title': 'Test Marketing Essay',
                    'assessment_type': 'Essay'
                }
                
                response = requests.post(f"{self.api_url}/briefs/upload",
                    files=files,
                    data=data,
                    cookies={'session_token': self.session_token},
                    timeout=30  # Longer timeout for AI processing
                )
                
                if response.status_code == 200:
                    brief_data = response.json()
                    if brief_data.get("brief_id") and brief_data.get("output_json"):
                        self.log_test("Brief Upload", True, f"Brief processed: {brief_data['brief_id']}")
                        return brief_data["brief_id"]
                    else:
                        self.log_test("Brief Upload", False, f"Invalid response: {brief_data}")
                elif response.status_code == 402:
                    self.log_test("Brief Upload", False, "Insufficient credits (expected for test)")
                else:
                    self.log_test("Brief Upload", False, f"Status {response.status_code}: {response.text}")
                    
        except Exception as e:
            self.log_test("Brief Upload", False, f"Exception: {str(e)}")
        finally:
            # Clean up test file
            try:
                os.unlink(test_file_path)
            except:
                pass
        
        return False

    def test_brief_history(self):
        """Test getting brief history"""
        if not self.session_token:
            self.log_test("Brief History", False, "No session token available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/briefs/history",
                cookies={'session_token': self.session_token},
                timeout=10
            )
            
            if response.status_code == 200:
                history_data = response.json()
                if isinstance(history_data, list):
                    self.log_test("Brief History", True, f"Retrieved {len(history_data)} briefs")
                    return True
                else:
                    self.log_test("Brief History", False, f"Invalid response format: {type(history_data)}")
            else:
                self.log_test("Brief History", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Brief History", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_logout(self):
        """Test user logout"""
        if not self.session_token:
            self.log_test("User Logout", False, "No session token available")
            return False
            
        try:
            response = requests.post(f"{self.api_url}/auth/logout",
                cookies={'session_token': self.session_token},
                timeout=10
            )
            
            if response.status_code == 200:
                logout_data = response.json()
                if logout_data.get("message"):
                    self.log_test("User Logout", True, "Successfully logged out")
                    return True
                else:
                    self.log_test("User Logout", False, f"Invalid response: {logout_data}")
            else:
                self.log_test("User Logout", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Logout", False, f"Exception: {str(e)}")
        
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🧪 Starting Simplifii API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 50)
        
        # Test registration
        self.test_auth_register()
        
        # Test login
        login_success = self.test_auth_login()
        
        if login_success:
            # Test authenticated endpoints
            self.test_auth_me()
            self.test_credit_balance()
            self.test_credit_purchase_initiation()
            self.test_brief_history()
            self.test_brief_upload()  # This might fail due to insufficient credits
            self.test_auth_logout()
        else:
            print("⚠️  Skipping authenticated tests due to login failure")
        
        # Print summary
        print("=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = SimplifiiAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())