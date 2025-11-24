import requests
import sys
import os
import tempfile
from datetime import datetime

class SkyCodecAPITester:
    def __init__(self, base_url="https://skycodec-demo.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("API Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("API Root Endpoint", False, str(e))
            return False

    def test_file_upload_compress(self):
        """Test file upload and compression endpoint"""
        try:
            # Create a test file
            test_content = b"This is a test file for SkyCodec compression testing. " * 100
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as temp_file:
                temp_file.write(test_content)
                temp_file.flush()
                
                # Test file upload
                with open(temp_file.name, 'rb') as f:
                    files = {'file': ('test_file.txt', f, 'text/plain')}
                    response = requests.post(f"{self.api_url}/compress", files=files, timeout=30)
                
                os.unlink(temp_file.name)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['file_id', 'original_name', 'original_size', 'compressed_size', 'compression_ratio', 'message']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", File ID: {data['file_id']}, Ratio: {data['compression_ratio']:.2f}"
                    # Store file_id for download test
                    self.test_file_id = data['file_id']
                    self.test_filename = data['original_name']
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("File Upload & Compression", success, details)
            return success, getattr(self, 'test_file_id', None)
            
        except Exception as e:
            self.log_test("File Upload & Compression", False, str(e))
            return False, None

    def test_file_size_limit(self):
        """Test file size limit (10MB)"""
        try:
            # Create a file larger than 10MB
            large_content = b"X" * (11 * 1024 * 1024)  # 11MB
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as temp_file:
                temp_file.write(large_content)
                temp_file.flush()
                
                with open(temp_file.name, 'rb') as f:
                    files = {'file': ('large_file.txt', f, 'text/plain')}
                    response = requests.post(f"{self.api_url}/compress", files=files, timeout=30)
                
                os.unlink(temp_file.name)
            
            # Should return 400 for file too large
            success = response.status_code == 400
            details = f"Status: {response.status_code}"
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("File Size Limit (10MB)", success, details)
            return success
            
        except Exception as e:
            self.log_test("File Size Limit (10MB)", False, str(e))
            return False

    def test_download_compressed_file(self, file_id):
        """Test downloading compressed file"""
        if not file_id:
            self.log_test("Download Compressed File", False, "No file_id available from upload test")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/download/{file_id}", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                # Check if response is a file
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                details += f", Content-Type: {content_type}, Size: {content_length} bytes"
                
                # Check if filename is in headers
                content_disposition = response.headers.get('content-disposition', '')
                if 'filename=' in content_disposition:
                    details += f", Filename header present"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Download Compressed File", success, details)
            return success
            
        except Exception as e:
            self.log_test("Download Compressed File", False, str(e))
            return False

    def test_download_nonexistent_file(self):
        """Test downloading non-existent file"""
        try:
            fake_file_id = "nonexistent-file-id-12345"
            response = requests.get(f"{self.api_url}/download/{fake_file_id}", timeout=10)
            
            # Should return 404 for non-existent file
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if response.status_code == 404:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Download Non-existent File (404)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Download Non-existent File (404)", False, str(e))
            return False

    def test_status_endpoints(self):
        """Test status check endpoints"""
        try:
            # Test POST /status
            test_data = {"client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"}
            response = requests.post(f"{self.api_url}/status", json=test_data, timeout=10)
            
            post_success = response.status_code == 200
            details = f"POST Status: {response.status_code}"
            
            if post_success:
                data = response.json()
                required_fields = ['id', 'client_name', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    post_success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", ID: {data['id']}"
            
            self.log_test("POST Status Endpoint", post_success, details)
            
            # Test GET /status
            response = requests.get(f"{self.api_url}/status", timeout=10)
            get_success = response.status_code == 200
            get_details = f"GET Status: {response.status_code}"
            
            if get_success:
                data = response.json()
                get_details += f", Records count: {len(data)}"
            
            self.log_test("GET Status Endpoint", get_success, get_details)
            
            return post_success and get_success
            
        except Exception as e:
            self.log_test("Status Endpoints", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SkyCodec Backend API Tests")
        print(f"📡 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test API availability
        if not self.test_api_root():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Test status endpoints
        self.test_status_endpoints()
        
        # Test file upload and compression
        upload_success, file_id = self.test_file_upload_compress()
        
        # Test file size limit
        self.test_file_size_limit()
        
        # Test file download (only if upload was successful)
        if upload_success and file_id:
            self.test_download_compressed_file(file_id)
        
        # Test download with non-existent file
        self.test_download_nonexistent_file()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = SkyCodecAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())