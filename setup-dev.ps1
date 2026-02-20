# Setup development database with realistic test data
# This script registers test users and sets up approval workflows for manual testing

$ErrorActionPreference = "Stop"
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717
$CopySign = [char]0x2298

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Mongo-Delete($tableName) {
    Write-ColorOutput "Yellow" "Deleting all records from carousel_auth.$tableName..."
    
    try {
        $output = "db = db.getSiblingDB('carousel_auth'); db.$tableName.deleteMany({})" | & mongosh --host localhost --port 27017 carousel_auth
        $deletedCountLine = $output | Select-String 'deletedCount' | ForEach-Object { $_.Line }
        if ($deletedCountLine -match 'deletedCount.?[:=] ?([0-9]+)') {
            $deletedCount = $matches[1]
        }
        else {
            $deletedCount = \"?\"
    }
    Write-Host "Deleted $deletedCount $tableName records from MongoDB ($mongoDb.$tableName)" -ForegroundColor Green
    $stepSummary += @{ step = "Delete $tableName from MongoDB"; status = "Success"; error = "" }
    } catch {
        Write-Host "Failed to clear $tableName $($_.Exception.Message)" -ForegroundColor Red
        $stepSummary += @{ step = "Delete $tableName from MongoDB"; status = "Failed"; error = $($_.Exception.Message) }
    }
}

# Step summary tracking
$stepSummary = @()

Write-ColorOutput "Cyan" "=== Carousel Development Setup ==="
Write-Host ""

# Delete all users from MongoDB
Mongo-Delete "users"

Write-Host ""

# Delete all credentials from carousel_auth.credentials
Mongo-Delete "credentials"

$testUsers = @(
    @{
        Email = "alice.johnson@acmecorp.com"
        FirstName = "Alice"
        LastName = "Johnson"
        Password = "SecureTest@2024"
        AccessLevel = "Admin"
        Description = "Admin user"
    },
    @{
        Email = "bob.smith@acmecorp.com"
        FirstName = "Bob"
        LastName = "Smith"
        Password = "SecureTest@2024"
        AccessLevel = "ReadWrite"
        Description = "ReadWrite user"
    },
    @{
        Email = "carol.williams@acmecorp.com"
        FirstName = "Carol"
        LastName = "Williams"
        Password = "SecureTest@2024"
        AccessLevel = "ReadOnly"
        Description = "ReadOnly user"
    },
    @{
        Email = "frank.martinez@supportteam.io"
        FirstName = "Frank"
        LastName = "Martinez"
        Password = "SecureTest@2024"
        AccessLevel = "Support"
        Description = "Support user"
    },
    @{
        Email = "david.brown@techstartup.io"
        FirstName = "David"
        LastName = "Brown"
        Password = "TestPass@789"
        AccessLevel = "ReadWrite"
        Description = "Pending approval"
    },
    @{
        Email = "emma.davis@innovate.co"
        FirstName = "Emma"
        LastName = "Davis"
        Password = "DevTest@456"
        AccessLevel = "Admin"
        Description = "Pending approval"
    }
)

Write-Host ""
Write-ColorOutput "Cyan" "Registering test users..."
Write-Host ""


# Insert test users and credentials directly into MongoDB using mongosh

Write-ColorOutput "Cyan" "Inserting test users and credentials directly into MongoDB..."
$mongoUserScript = ""
$mongoCredScript = ""

foreach ($user in $testUsers) {
    $plainPassword = [string]$user["Password"]
    $plainPassword1 = [string]$user["Password"]
    $plainPassword2 = [string]$user.password
        $bytes1 = [System.Text.Encoding]::UTF8.GetBytes($plainPassword1)
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        $passwordHash1 = ([BitConverter]::ToString($sha256.ComputeHash($bytes1)) -replace '-', '').ToLower()
        $bytes2 = [System.Text.Encoding]::UTF8.GetBytes($plainPassword2)
        $passwordHash2 = ([BitConverter]::ToString($sha256.ComputeHash($bytes2)) -replace '-', '').ToLower()
        $passwordHash = $passwordHash1
    $mongoUserScript += @"
db = db.getSiblingDB('carousel_user');
db.users.insertOne({
    email: '$($user.Email)',
    firstName: '$($user.FirstName)',
    lastName: '$($user.LastName)',
    password: '$plainPassword',
    accessLevel: '$($user.AccessLevel)',
    description: '$($user.Description)',
    emailVerified: true,
    createdAt: new Date()
});
"@
    $mongoCredScript += @"
db = db.getSiblingDB('carousel_auth');
db.credentials.insertOne({
    email: '$($user.Email)',
    passwordHash: '$passwordHash',
    createdAt: new Date(),
    updatedAt: new Date()
});
"@
        # Removed duplicate hash calculation
}

try {
    $output1 = $mongoUserScript | & mongosh --host localhost --port 27017 carousel_user
    $output2 = $mongoCredScript | & mongosh --host localhost --port 27017 carousel_auth
    Write-ColorOutput "Green" "Inserted test users and credentials into MongoDB."
    $stepSummary += @{ step = "Insert test users & credentials"; status = "Success"; error = "" }
} catch {
    Write-ColorOutput "Red" "Failed to insert test users or credentials: $($_.Exception.Message)"
    $stepSummary += @{ step = "Insert test users & credentials"; status = "Failed"; error = ("$_".Substring(0, [Math]::Min(50, ("$_").Length))) }
}

# No login/approval steps needed when inserting directly into DB


Write-Host ""
Write-ColorOutput "Cyan" "================ Setup Step Summary ================"
foreach ($step in $stepSummary) {
    $color = if ($step.status -eq "Success") { "Green" } else { "Red" }
    $msg = "[" + $step.status + "] " + $step.step
    if ($step.error -and $step.error -ne "") { $msg += ": $($step.error)" }
    Write-ColorOutput $color $msg
}
Write-ColorOutput "Cyan" "=================================================="
Write-Host ""

Write-ColorOutput "Cyan" "Test Login Credentials:"
Write-Host ""
Write-Host "  Admin Access:" -ForegroundColor Cyan
Write-Host "    Email: alice.johnson@acmecorp.com"
Write-Host "    Password: SecureTest@2024"
Write-Host ""
Write-Host "  Support Access:" -ForegroundColor Cyan
Write-Host "    Email: frank.martinez@supportteam.io"
Write-Host "    Password: SecureTest@2024"
Write-Host ""
Write-Host "  ReadWrite Access:" -ForegroundColor Cyan
Write-Host "    Email: bob.smith@acmecorp.com"
Write-Host "    Password: SecureTest@2024"
Write-Host ""
Write-Host "  ReadOnly Access:" -ForegroundColor Cyan
Write-Host "    Email: carol.williams@acmecorp.com"
Write-Host "    Password: SecureTest@2024"
Write-Host ""
Write-Host "  Pending Approval:" -ForegroundColor Yellow
Write-Host "    Email: david.brown@techstartup.io (ReadWrite)"
Write-Host "    Email: emma.davis@innovate.co (Admin)"
Write-Host ""
Write-ColorOutput "Yellow" "Note: Use these credentials to manually test the application"
Write-Host ""

