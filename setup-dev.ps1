# Setup development database with role-based test data
# Seeds users, credentials, roles, role assignments, pending users, and pending approvals

$ErrorActionPreference = "Stop"
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Invoke-MongoScript {
    param(
        [Parameter(Mandatory = $true)][string]$Database,
        [Parameter(Mandatory = $true)][string]$Script
    )

    $Script | & mongosh --host localhost --port 27017 $Database | Out-Null
}

function Remove-MongoCollectionData {
    param(
        [Parameter(Mandatory = $true)][string]$Database,
        [Parameter(Mandatory = $true)][string]$Collection
    )

    Write-ColorOutput "Yellow" "Deleting all records from $Database.$Collection..."
    try {
        $result = "db = db.getSiblingDB('$Database'); const r = db.$Collection.deleteMany({}); printjson(r);" | & mongosh --host localhost --port 27017 $Database
        $deletedCount = "?"
        $line = $result | Select-String 'deletedCount' | Select-Object -First 1
        if ($line -and $line.Line -match 'deletedCount.?[:=] ?([0-9]+)') {
            $deletedCount = $matches[1]
        }

        Write-ColorOutput "Green" "Deleted $deletedCount record(s) from $Database.$Collection"
        $script:stepSummary += @{ step = "Delete $Database.$Collection"; status = "Success"; error = "" }
    } catch {
        Write-ColorOutput "Red" ("Failed to clear " + $Database + "." + $Collection + ": " + $_.Exception.Message)
        $script:stepSummary += @{ step = "Delete $Database.$Collection"; status = "Failed"; error = $($_.Exception.Message) }
    }
}

# Step summary tracking
$stepSummary = @()

Write-ColorOutput "Cyan" "=== Carousel Development Setup (Role-Based Access) ==="
Write-Host ""

if (-not (Get-Command "mongosh" -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "Red" "[-] mongosh not found in PATH. Install MongoDB Shell and retry."
    exit 1
}

$activeUsers = @(
    @{
        Email = "alice.johnson@acmecorp.com"
        FirstName = "Alice"
        LastName = "Johnson"
        Password = "SecureTest@2024"
        AccessLevel = "Admin"
        Roles = @("Support", "PowerUser")
        Description = "Admin user"
    },
    @{
        Email = "bob.smith@acmecorp.com"
        FirstName = "Bob"
        LastName = "Smith"
        Password = "SecureTest@2024"
        AccessLevel = "User"
        Roles = @("PowerUser")
        Description = "Power user"
    },
    @{
        Email = "carol.williams@acmecorp.com"
        FirstName = "Carol"
        LastName = "Williams"
        Password = "SecureTest@2024"
        AccessLevel = "User"
        Roles = @("ReadOnly")
        Description = "Read-only user"
    },
    @{
        Email = "frank.martinez@supportteam.io"
        FirstName = "Frank"
        LastName = "Martinez"
        Password = "SecureTest@2024"
        AccessLevel = "User"
        Roles = @("Support")
        Description = "Support user"
    }
)

$pendingUsers = @(
    @{
        Email = "david.brown@techstartup.io"
        FirstName = "David"
        LastName = "Brown"
        Password = "TestPass@789"
        RequestedAccessLevel = "Admin"
    },
    @{
        Email = "emma.davis@innovate.co"
        FirstName = "Emma"
        LastName = "Davis"
        Password = "DevTest@456"
        RequestedAccessLevel = "Admin"
    }
)

# Clear data in dependency-safe order
Remove-MongoCollectionData "carousel_approval" "approvals"
Remove-MongoCollectionData "carousel_roles" "user_roles"
Remove-MongoCollectionData "carousel_roles" "roles"
Remove-MongoCollectionData "carousel_user" "pending_users"
Remove-MongoCollectionData "carousel_user" "users"
Remove-MongoCollectionData "carousel_auth" "credentials"

Write-Host ""
Write-ColorOutput "Cyan" "Seeding roles, users, credentials, pending users, and approvals..."

try {
    # Seed user and auth data (active users only)
    $mongoUserScript = "db = db.getSiblingDB('carousel_user');`n"
    $mongoCredScript = "db = db.getSiblingDB('carousel_auth');`n"
    $sha256 = [System.Security.Cryptography.SHA256]::Create()

    foreach ($user in $activeUsers) {
        $passwordBytes = [System.Text.Encoding]::UTF8.GetBytes([string]$user.Password)
        $passwordHash = ([BitConverter]::ToString($sha256.ComputeHash($passwordBytes)) -replace '-', '').ToLower()

        $mongoUserScript += @"
    db.users.insertOne({
      email: '$($user.Email)',
      firstName: '$($user.FirstName)',
      lastName: '$($user.LastName)',
      accessLevel: '$($user.AccessLevel)',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
"@

        $mongoCredScript += @"
    db.credentials.insertOne({
      email: '$($user.Email)',
      passwordHash: '$passwordHash',
      createdAt: new Date(),
      updatedAt: new Date()
    });
"@
    }

    Invoke-MongoScript -Database "carousel_user" -Script $mongoUserScript
    Invoke-MongoScript -Database "carousel_auth" -Script $mongoCredScript

    # Seed pending users (email already verified) and corresponding approval requests
    $mongoPendingAndApprovalScript = "db = db.getSiblingDB('carousel_user');`n"

    foreach ($pending in $pendingUsers) {
        $verificationToken = [Guid]::NewGuid().ToString()

        $mongoPendingAndApprovalScript += @"
    const pendingDoc = {
      email: '$($pending.Email)',
      firstName: '$($pending.FirstName)',
      lastName: '$($pending.LastName)',
      password: '$($pending.Password)',
      requestedAccessLevel: '$($pending.RequestedAccessLevel)',
      emailVerificationToken: '$verificationToken',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const pendingResult = db.pending_users.insertOne(pendingDoc);

    const approvalDb = db.getSiblingDB('carousel_approval');
    approvalDb.approvals.insertOne({
      pendingUserId: pendingResult.insertedId.toString(),
      targetUserId: null,
      email: '$($pending.Email)',
      firstName: '$($pending.FirstName)',
      lastName: '$($pending.LastName)',
      requestedAccessLevel: '$($pending.RequestedAccessLevel)',
      requestType: 'NEW_USER',
      approved: false,
      approvedBy: null,
      createdAt: new Date(),
      approvedAt: null
    });

    db = db.getSiblingDB('carousel_user');
"@
    }

    Invoke-MongoScript -Database "carousel_user" -Script $mongoPendingAndApprovalScript

    # Seed roles and role assignments
    $mongoRoleScript = @"
db = db.getSiblingDB('carousel_roles');

db.roles.insertMany([
  { name: 'Support', description: 'Full access to user management' },
  { name: 'ReadOnly', description: 'Read-only access' },
  { name: 'PowerUser', description: 'Elevated access to advanced functionality' }
]);

"@

    foreach ($user in $activeUsers) {
        $rolesJson = "[" + (($user.Roles | ForEach-Object { "'$_'" }) -join ", ") + "]"
        $mongoRoleScript += "db.user_roles.insertOne({ userEmail: '$($user.Email)', roles: $rolesJson, updatedAt: new Date() });`n"
    }

    Invoke-MongoScript -Database "carousel_roles" -Script $mongoRoleScript

    Write-ColorOutput "Green" "$CheckMark Seed data inserted successfully"
    $stepSummary += @{ step = "Seed role-based test data"; status = "Success"; error = "" }
} catch {
    Write-ColorOutput "Red" "$CrossMark Failed to seed test data: $($_.Exception.Message)"
    $stepSummary += @{ step = "Seed role-based test data"; status = "Failed"; error = $($_.Exception.Message) }
}

Write-Host ""
Write-ColorOutput "Cyan" "================ Setup Step Summary ================"
foreach ($step in $stepSummary) {
    $color = if ($step.status -eq "Success") { "Green" } else { "Red" }
    $msg = "[$($step.status)] $($step.step)"
    if ($step.error) { $msg += ": $($step.error)" }
    Write-ColorOutput $color $msg
}
Write-ColorOutput "Cyan" "===================================================="
Write-Host ""

Write-ColorOutput "Cyan" "Test Login Credentials:"
Write-Host ""
Write-Host "  Admin Access:" -ForegroundColor Cyan
Write-Host "    Email: alice.johnson@acmecorp.com"
Write-Host "    Password: SecureTest@2024"
Write-Host "    AccessLevel: Admin"
Write-Host "    Roles: Support, PowerUser"
Write-Host ""
Write-Host "  Support Access:" -ForegroundColor Cyan
Write-Host "    Email: frank.martinez@supportteam.io"
Write-Host "    Password: SecureTest@2024"
Write-Host "    AccessLevel: User"
Write-Host "    Roles: Support"
Write-Host ""
Write-Host "  PowerUser Access:" -ForegroundColor Cyan
Write-Host "    Email: bob.smith@acmecorp.com"
Write-Host "    Password: SecureTest@2024"
Write-Host "    AccessLevel: User"
Write-Host "    Roles: PowerUser"
Write-Host ""
Write-Host "  ReadOnly Access:" -ForegroundColor Cyan
Write-Host "    Email: carol.williams@acmecorp.com"
Write-Host "    Password: SecureTest@2024"
Write-Host "    AccessLevel: User"
Write-Host "    Roles: ReadOnly"
Write-Host ""
Write-Host "  Pending Admin Approval:" -ForegroundColor Yellow
Write-Host "    david.brown@techstartup.io"
Write-Host "    emma.davis@innovate.co"
Write-Host ""
Write-ColorOutput "Yellow" "Note: Pending users are email-verified and have open approval requests in carousel_approval.approvals"
Write-Host ""
