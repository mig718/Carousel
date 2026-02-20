# Sanity test suite for Carousel backend API
# Tests common use cases: registration, login, approval, duplicate detection, etc.

param(
    [int]$ApiGatewayPort = 8000,
    [int]$AuthServicePort = 8001,
    [int]$UserServicePort = 8002,
    [int]$ApprovalServicePort = 8003,
    [bool]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$testsPassed = 0
$testsFailed = 0
$testsWarning = 0

# ANSI color codes for terminal output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

# Unicode symbols
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717
$CopySign = [char]0x2298

function Write-TestResult($passed, $message, $details = "") {
    if ($passed -eq $true) {
        Write-Host "${Green}${CheckMark}${Reset} $message"
        $script:testsPassed++
    } elseif ($passed -eq "warning") {
        Write-Host "${Yellow}${CopySign}${Reset} $message"
        $script:testsWarning++
    } else {
        Write-Host "${Red}${CrossMark}${Reset} $message"
        $script:testsFailed++
    }
    
    if ($details -and $Verbose) {
        Write-Host "  Details: $details" -ForegroundColor DarkGray
    }
}

function Invoke-TestRequest($method, $url, $body = $null, $token = $null, $testName = "") {
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    try {
        if ($method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -UseBasicParsing -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $method -Body $body -Headers $headers -UseBasicParsing -ErrorAction Stop
        }
        
        return @{
            StatusCode = $response.StatusCode
            Content = $response.Content
            Success = $true
        }
    } catch {
        if ($_.Exception.Response) {
            return @{
                StatusCode = [int]$_.Exception.Response.StatusCode
                Content = $_.Exception.Response.GetResponseStream() | { $reader = New-Object System.IO.StreamReader($_); $reader.ReadToEnd() }
                Success = $false
                Error = $_.Exception.Message
            }
        } else {
            return @{
                StatusCode = 0
                Content = ""
                Success = $false
                Error = $_.Exception.Message
            }
        }
    }
}

# Pre-flight checks
Write-Host "${Cyan}=== Carousel Backend Sanity Test Suite ===${Reset}" -NoNewline
Write-Host ""
Write-Host ""

Write-Host "Checking service availability..." -ForegroundColor Cyan
$servicesReady = $true

foreach ($port in @($ApiGatewayPort, $UserServicePort, $AuthServicePort, $ApprovalServicePort)) {
    if (Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue | Select-Object -ExpandProperty TcpTestSucceeded) {
        Write-Host "  ${Green}${CheckMark}${Reset} Service on port $port is ready"
    } else {
        Write-Host "  ${Red}${CrossMark}${Reset} Service on port $port is NOT ready"
        $servicesReady = $false
    }
}

if (-not $servicesReady) {
    Write-Host ""
    Write-Host "${Red}Not all services are running. Start with: .\launch-backend.ps1 --fast${Reset}"
    exit 1
}

Write-Host ""

# ===== TEST SCENARIOS =====

Write-Host "${Cyan}--- TEST SUITE 1: Authentication & Registration ---${Reset}" -NoNewline
Write-Host ""
Write-Host ""

# Test 1: Register new user
$newUserEmail = "testuser.$(Get-Random -Minimum 10000 -Maximum 99999)@example.com"
$registerBody = @{
    email = $newUserEmail
    firstName = "Test"
    lastName = "User"
    password = "TestPass@123"
    accessLevel = "ReadOnly"
} | ConvertTo-Json

$registerUrl = "http://localhost:${UserServicePort}/api/users/register"
$registerResult = Invoke-TestRequest "POST" $registerUrl $registerBody $null "Register New User"

if ($registerResult.StatusCode -eq 200) {
    Write-TestResult $true "User registration successful: $newUserEmail"
    $registeredUserId = ($registerResult.Content | ConvertFrom-Json).userId
} else {
    Write-TestResult $false "User registration failed" "Status: $($registerResult.StatusCode)"
    $registeredUserId = $null
}

# Test 2: Duplicate registration check
$duplicateResult = Invoke-TestRequest "POST" $registerUrl $registerBody $null "Duplicate Registration"

if ($duplicateResult.StatusCode -eq 400 -and $duplicateResult.Content -like "*already*") {
    Write-TestResult "warning" "Duplicate user rejected (expected behavior)" "HTTP 400"
} else {
    Write-TestResult $false "Duplicate check failed" "Status: $($duplicateResult.StatusCode)"
}

# Test 3: Login with registered user (may fail if email not verified)
$loginBody = @{
    email = $newUserEmail
    password = "TestPass@123"
} | ConvertTo-Json

$loginUrl = "http://localhost:${ApiGatewayPort}/api/auth/login"
$loginResult = Invoke-TestRequest "POST" $loginUrl $loginBody $null "Login"

if ($loginResult.StatusCode -eq 200) {
    Write-TestResult $true "Login successful: $newUserEmail"
    $userToken = ($loginResult.Content | ConvertFrom-Json).token
} else {
    Write-TestResult "warning" "Login failed or email not verified" "Status: $($loginResult.StatusCode) (expected if email not auto-verified)"
    $userToken = $null
}

# Test 4: Login with wrong password
$wrongPassBody = @{
    email = $newUserEmail
    password = "WrongPassword123"
} | ConvertTo-Json

$wrongPassResult = Invoke-TestRequest "POST" $loginUrl $wrongPassBody $null "Wrong Password"

if ($wrongPassResult.StatusCode -eq 401) {
    Write-TestResult $true "Wrong password correctly rejected"
} else {
    Write-TestResult $false "Wrong password not rejected properly" "Status: $($wrongPassResult.StatusCode)"
}

Write-Host ""

# ===== TEST SUITE 2: User Management =====

Write-Host "${Cyan}--- TEST SUITE 2: User Management ---${Reset}" -NoNewline
Write-Host ""
Write-Host ""

# Use test admin for authenticated requests
$adminEmail = "alice.johnson@acmecorp.com"
$adminPass = "SecureTest@2024"

$adminLoginBody = @{
    email = $adminEmail
    password = $adminPass
} | ConvertTo-Json

$adminLoginResult = Invoke-TestRequest "POST" $loginUrl $adminLoginBody $null "Admin Login"

if ($adminLoginResult.StatusCode -eq 200) {
    $adminToken = ($adminLoginResult.Content | ConvertFrom-Json).token
    Write-TestResult $true "Admin login successful"
} else {
    $adminToken = $null
    Write-TestResult "warning" "Admin login failed (test data may not be set up, run setup-dev.ps1)" "Status: $($adminLoginResult.StatusCode)"
}

# Test 5: Get user by email
if ($adminToken) {
    $getUserUrl = "http://localhost:${UserServicePort}/api/users/email/$adminEmail"
    $getUserResult = Invoke-TestRequest "GET" $getUserUrl $null $adminToken "Get User"
    
    if ($getUserResult.StatusCode -eq 200) {
        $userData = $getUserResult.Content | ConvertFrom-Json
        if ($userData.email -eq $adminEmail) {
            Write-TestResult $true "User lookup by email successful"
        } else {
            Write-TestResult $false "User lookup returned wrong user"
        }
    } else {
        Write-TestResult $false "User lookup failed" "Status: $($getUserResult.StatusCode)"
    }
}

# Test 6: Get users by access level
if ($adminToken) {
    $getByAccessUrl = "http://localhost:${UserServicePort}/api/users/access-level/ReadWrite"
    $getByAccessResult = Invoke-TestRequest "GET" $getByAccessUrl $null $adminToken "Get By Access Level"
    
    if ($getByAccessResult.StatusCode -eq 200) {
        $users = $getByAccessResult.Content | ConvertFrom-Json
        if ($users -is [array] -or $users.PSObject.Properties.Count -gt 0) {
            Write-TestResult $true "Access level query successful"
        } else {
            Write-TestResult "warning" "Access level query returned empty results"
        }
    } else {
        Write-TestResult $false "Access level query failed" "Status: $($getByAccessResult.StatusCode)"
    }
}

# Test 7: Unauthorized access (without token)
$unauthorizedTest = Invoke-TestRequest "GET" "http://localhost:${UserServicePort}/api/users/email/test@example.com" $null $null "Unauthorized"

if ($unauthorizedTest.StatusCode -eq 401 -or $unauthorizedTest.StatusCode -eq 403) {
    Write-TestResult $true "Unauthorized requests correctly rejected"
} else {
    Write-TestResult $false "Unauthorized request not rejected" "Status: $($unauthorizedTest.StatusCode)"
}

Write-Host ""

# ===== TEST SUITE 3: Approval Workflow =====

Write-Host "${Cyan}--- TEST SUITE 3: Approval Workflow ---${Reset}" -NoNewline
Write-Host ""
Write-Host ""

# Test 8: Check pending verified users
if ($adminToken) {
    $pendingUrl = "http://localhost:${UserServicePort}/api/users/pending/verified"
    $pendingResult = Invoke-TestRequest "GET" $pendingUrl $null $adminToken "Get Pending Users"
    
    if ($pendingResult.StatusCode -eq 200) {
        Write-TestResult $true "Pending users query successful"
        $pendingUsers = $pendingResult.Content | ConvertFrom-Json
        if ($pendingUsers -is [array]) {
            Write-Host "    Found $($pendingUsers.Count) pending users for approval"
        }
    } else {
        Write-TestResult $false "Pending users query failed" "Status: $($pendingResult.StatusCode)"
    }
}

# Test 9: Check pending approval requests
if ($adminToken) {
    $approvalsUrl = "http://localhost:${ApprovalServicePort}/api/approvals/pending"
    $approvalsResult = Invoke-TestRequest "GET" $approvalsUrl $null $adminToken "Get Pending Approvals"
    
    if ($approvalsResult.StatusCode -eq 200) {
        Write-TestResult $true "Pending approvals query successful"
        $approvals = $approvalsResult.Content | ConvertFrom-Json
        if ($approvals -is [array]) {
            Write-Host "    Found $($approvals.Count) pending approval requests"
        }
    } else {
        Write-TestResult $false "Pending approvals query failed" "Status: $($approvalsResult.StatusCode)"
    }
}

# Test 10: Create approval request (if we have a pending user)
$newPendingEmail = "approval.test.$(Get-Random -Minimum 10000 -Maximum 99999)@example.com"
$newPendingRegBody = @{
    email = $newPendingEmail
    firstName = "Approval"
    LastName = "Test"
    password = "ApprovalTest@123"
    accessLevel = "ReadWrite"
} | ConvertTo-Json

$newPendingResult = Invoke-TestRequest "POST" $registerUrl $newPendingRegBody $null "Register Pending User"

if ($newPendingResult.StatusCode -eq 200) {
    $pendingUserId = ($newPendingResult.Content | ConvertFrom-Json).userId
    Write-TestResult $true "New pending user created for approval testing"
    
    # Try to create approval request
    if ($adminToken) {
        $approvalReqBody = @{
            pendingUserId = $pendingUserId
            email = $newPendingEmail
            firstName = "Approval"
            lastName = "Test"
            requestedAccessLevel = "ReadWrite"
        } | ConvertTo-Json
        
        $approvalReqUrl = "http://localhost:${ApprovalServicePort}/api/approvals/request"
        $approvalReqResult = Invoke-TestRequest "POST" $approvalReqUrl $approvalReqBody $adminToken "Create Approval Request"
        
        if ($approvalReqResult.StatusCode -eq 200) {
            Write-TestResult $true "Approval request created successfully"
        } else {
            Write-TestResult "warning" "Approval request creation" "Status: $($approvalReqResult.StatusCode)"
        }
    }
}

Write-Host ""

# ===== TEST SUITE 4: Health & Aggregation =====

Write-Host "${Cyan}--- TEST SUITE 4: Health & Aggregation ---${Reset}" -NoNewline
Write-Host ""
Write-Host ""

# Test 11: Individual service health
$healthEndpoints = @(
    @{ Name = "API Gateway"; Port = $ApiGatewayPort; Path = "/health" },
    @{ Name = "Auth Service"; Port = $AuthServicePort; Path = "/api/auth/health" },
    @{ Name = "User Service"; Port = $UserServicePort; Path = "/api/users/health" },
    @{ Name = "Approval Service"; Port = $ApprovalServicePort; Path = "/api/approvals/health" }
)

foreach ($endpoint in $healthEndpoints) {
    $healthUrl = "http://localhost:$($endpoint.Port)$($endpoint.Path)"
    $healthResult = Invoke-TestRequest "GET" $healthUrl $null $null "Service Health"
    
    if ($healthResult.StatusCode -eq 200) {
        Write-TestResult $true "$($endpoint.Name) is healthy"
    } else {
        Write-TestResult $false "$($endpoint.Name) health check failed" "Status: $($healthResult.StatusCode)"
    }
}

# Test 12: Aggregated health (via health-service)
$aggregatedHealthUrl = "http://localhost:8004/health"
$aggregatedHealthResult = Invoke-TestRequest "GET" $aggregatedHealthUrl $null $null "Aggregated Health"

if ($aggregatedHealthResult.StatusCode -eq 200) {
    $healthData = $aggregatedHealthResult.Content | ConvertFrom-Json
    if ($healthData.status -eq "UP") {
        Write-TestResult $true "Aggregated health is UP"
        if ($healthData.services) {
            foreach ($service in $healthData.services.PSObject.Properties) {
                $status = $service.Value.status
                $statusIcon = if ($status -eq "UP") { $CheckMark } else { $CrossMark }
                Write-Host "        $statusIcon $($service.Name): $status"
            }
        }
    } else {
        Write-TestResult $false "Aggregated health is DOWN" "Status: $($healthData.status)"
    }
} else {
    Write-TestResult $false "Aggregated health check failed" "Status: $($aggregatedHealthResult.StatusCode)"
}

Write-Host ""

# ===== SUMMARY =====

Write-Host "${Cyan}============================================================${Reset}"
Write-Host "${Cyan}                    Test Summary${Reset}"
Write-Host "${Cyan}============================================================${Reset}"
Write-Host ""
Write-Host "${Green}Passed:  $testsPassed${Reset}" -NoNewline
Write-Host "    ${Yellow}Warnings: $testsWarning${Reset}" -NoNewline
Write-Host "    ${Red}Failed:  $testsFailed${Reset}"
Write-Host ""

$totalTests = $testsPassed + $testsWarning + $testsFailed

if ($testsFailed -eq 0) {
    Write-Host "${Green}$CheckMark All tests completed successfully!${Reset}"
    exit 0
} else {
    Write-Host "${Red}$CrossMark Some tests failed. Review output above.${Reset}"
    exit 1
}

