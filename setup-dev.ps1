# Setup development database with role-based and inventory test data
# Seeds users, credentials, roles, role assignments, pending users, approvals, resource types, resource tags, resources, and inventory items in PostgreSQL

$ErrorActionPreference = "Stop"
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Invoke-PostgresScript {
    param(
        [Parameter(Mandatory = $true)][string]$Database,
        [Parameter(Mandatory = $true)][string]$Script
    )

    $dockerContainer = "carousel-postgres"
    $dockerCommand = Get-Command "docker" -ErrorAction SilentlyContinue

    if ($dockerCommand) {
        $containerExists = & docker ps --format "{{.Names}}" | Select-String -Pattern "^$dockerContainer$"
        if ($containerExists) {
            $Script | & docker exec -i $dockerContainer psql -U postgres -d $Database -v ON_ERROR_STOP=1 | Out-Null
            return
        }
    }

    if (Get-Command "psql" -ErrorAction SilentlyContinue) {
        $env:PGPASSWORD = "postgres"
        $Script | & psql -h localhost -p 5432 -U postgres -d $Database -v ON_ERROR_STOP=1 | Out-Null
        return
    }

    throw "Neither running '$dockerContainer' container nor local psql was found. Start docker-compose (postgres) or install psql."
}

# Step summary tracking
$stepSummary = @()

Write-ColorOutput "Cyan" "=== Carousel Development Setup (Role-Based Access / PostgreSQL) ==="
Write-Host ""

$activeUsers = @(
    @{
        Email = "alice.johnson@acmecorp.com"
        FirstName = "Alice"
        LastName = "Johnson"
        Password = "SecureTest@2024"
        AccessLevel = "Admin"
        Roles = @("Support", "PowerUser", "InventoryManager", "InventoryAdmin")
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
    },
    @{
        Email = "ivy.morris@warehouse.io"
        FirstName = "Ivy"
        LastName = "Morris"
        Password = "SecureTest@2024"
        AccessLevel = "User"
        Roles = @("InventoryAdmin", "InventoryManager")
        Description = "Inventory admin"
    },
    @{
        Email = "isaac.turner@warehouse.io"
        FirstName = "Isaac"
        LastName = "Turner"
        Password = "SecureTest@2024"
        AccessLevel = "User"
        Roles = @("InventoryUser")
        Description = "Inventory user"
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

try {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $now = Get-Date

    $sql = @"
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth_credentials (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  access_level VARCHAR(32),
  email_verified BOOLEAN NOT NULL,
  email_verification_token VARCHAR(255),
  password VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  password VARCHAR(255),
  requested_access_level VARCHAR(32),
  email_verification_token VARCHAR(255),
  email_verified BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id VARCHAR(36) PRIMARY KEY,
  pending_user_id VARCHAR(36),
  target_user_id VARCHAR(36),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  requested_access_level VARCHAR(32),
  request_type VARCHAR(64),
  approved BOOLEAN NOT NULL,
  approved_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  editable BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_user_role_assignment UNIQUE (user_id, role_id)
);

DELETE FROM user_role_assignments;
DELETE FROM roles;
DELETE FROM approval_requests;
DELETE FROM pending_users;
DELETE FROM auth_credentials;
DELETE FROM app_users;

INSERT INTO roles (id, name, description, editable) VALUES
  (gen_random_uuid()::text, 'Support', 'Full access to user management', false),
  (gen_random_uuid()::text, 'ReadOnly', 'Read-only access', false),
  (gen_random_uuid()::text, 'PowerUser', 'Elevated access to advanced functionality', false),
  (gen_random_uuid()::text, 'InventoryManager', 'Manage inventory items and type metadata', false),
  (gen_random_uuid()::text, 'InventoryUser', 'Manage inventory items and quantities', false),
  (gen_random_uuid()::text, 'InventoryAdmin', 'Inventory administration with type/subtype management', false);
"@

    $userIdByEmail = @{}

    foreach ($user in $activeUsers) {
        $id = [Guid]::NewGuid().ToString()
        $userIdByEmail[$user.Email] = $id

        $passwordBytes = [System.Text.Encoding]::UTF8.GetBytes([string]$user.Password)
        $passwordHash = ([BitConverter]::ToString($sha256.ComputeHash($passwordBytes)) -replace '-', '').ToLower()
        $verificationToken = [Guid]::NewGuid().ToString()

        $escapedEmail = $user.Email -replace "'", "''"
        $escapedFirstName = $user.FirstName -replace "'", "''"
        $escapedLastName = $user.LastName -replace "'", "''"
        $escapedAccessLevel = $user.AccessLevel -replace "'", "''"
        $escapedHash = $passwordHash -replace "'", "''"
        $escapedToken = $verificationToken -replace "'", "''"

        $sql += @"
INSERT INTO app_users (id, email, first_name, last_name, access_level, email_verified, email_verification_token, password, created_at, updated_at)
VALUES ('$id', '$escapedEmail', '$escapedFirstName', '$escapedLastName', '$escapedAccessLevel', true, '$escapedToken', NULL, NOW(), NOW());

INSERT INTO auth_credentials (id, email, password_hash, created_at, updated_at)
VALUES ('$id', '$escapedEmail', '$escapedHash', NOW(), NOW());
"@
    }

    foreach ($pending in $pendingUsers) {
        $pendingId = [Guid]::NewGuid().ToString()
        $verificationToken = [Guid]::NewGuid().ToString()

        $escapedEmail = $pending.Email -replace "'", "''"
        $escapedFirstName = $pending.FirstName -replace "'", "''"
        $escapedLastName = $pending.LastName -replace "'", "''"
        $escapedPassword = $pending.Password -replace "'", "''"
        $escapedLevel = $pending.RequestedAccessLevel -replace "'", "''"
        $escapedToken = $verificationToken -replace "'", "''"

        $sql += @"
INSERT INTO pending_users (id, email, first_name, last_name, password, requested_access_level, email_verification_token, email_verified, created_at, updated_at)
VALUES ('$pendingId', '$escapedEmail', '$escapedFirstName', '$escapedLastName', '$escapedPassword', '$escapedLevel', '$escapedToken', true, NOW(), NOW());

INSERT INTO approval_requests (id, pending_user_id, target_user_id, email, first_name, last_name, requested_access_level, request_type, approved, approved_by, created_at, approved_at)
VALUES (gen_random_uuid()::text, '$pendingId', NULL, '$escapedEmail', '$escapedFirstName', '$escapedLastName', '$escapedLevel', 'NEW_USER', false, NULL, NOW(), NULL);
"@
    }

    foreach ($user in $activeUsers) {
        $userId = $userIdByEmail[$user.Email]
        if (-not $userId) {
            throw "Could not resolve user ID for $($user.Email)"
        }

        foreach ($roleName in $user.Roles) {
            $escapedRoleName = $roleName -replace "'", "''"
            $sql += @"
INSERT INTO user_role_assignments (id, user_id, role_id, updated_at)
SELECT gen_random_uuid()::text, '$userId', r.id, NOW()
FROM roles r
WHERE r.name = '$escapedRoleName'
ON CONFLICT (user_id, role_id) DO NOTHING;
"@
        }
    }

    Invoke-PostgresScript -Database "carousel_roles" -Script $sql

    Write-ColorOutput "Green" "$CheckMark Seed data inserted successfully"
    $stepSummary += @{ step = "Seed role-based test data"; status = "Success"; error = "" }
} catch {
    Write-ColorOutput "Red" "$CrossMark Failed to seed test data: $($_.Exception.Message)"
    $stepSummary += @{ step = "Seed role-based test data"; status = "Failed"; error = $($_.Exception.Message) }
}

try {
        $inventorySql = @"
CREATE TABLE IF NOT EXISTS inventory_resource_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    icon VARCHAR(32),
    parent_type_id VARCHAR(36),
    parent_type_name VARCHAR(255),
    editable BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_resource_tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    color VARCHAR(16),
    graphic VARCHAR(64),
    editable BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_resources (
    id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(255),
    type VARCHAR(255),
    sub_type VARCHAR(255),
    resource_type_id VARCHAR(36),
    resource_tags VARCHAR(512),
    icon VARCHAR(32),
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(36) PRIMARY KEY,
    resource_id VARCHAR(36),
    resource_category VARCHAR(255),
    resource_type VARCHAR(255),
    resource_sub_type VARCHAR(255),
    resource_tags VARCHAR(512),
    resource_icon VARCHAR(32),
    resource_description VARCHAR(255),
    custom_tag_ids VARCHAR(512),
    available_quantity INTEGER NOT NULL,
    pending_quantity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

DELETE FROM inventory_items;
DELETE FROM inventory_resources;
DELETE FROM inventory_resource_tags;
DELETE FROM inventory_resource_types;

INSERT INTO inventory_resource_types (id, name, description, icon, parent_type_id, parent_type_name, editable, created_at, updated_at) VALUES
('rt-metal', 'Metal', 'Base metal resources used in jewelry production', chr(129689), NULL, NULL, false, NOW(), NOW()),
('rt-stone', 'Stone', 'Natural and lab stones including melee and center stones', chr(128142), NULL, NULL, false, NOW(), NOW()),
('rt-cast', 'Cast', 'Pre-cast models and wax/cast artifacts', chr(129513), NULL, NULL, false, NOW(), NOW()),
('rt-finding', 'Finding', 'Clasps, hooks, jump rings and other findings', chr(128279), NULL, NULL, false, NOW(), NOW()),
('rt-consumable', 'Consumable', 'Solders, fluxes and process consumables', chr(9881), NULL, NULL, false, NOW(), NOW());

INSERT INTO inventory_resource_tags (id, name, description, color, graphic, editable, created_at, updated_at) VALUES
('tag-yellow', 'yellow', 'Color tone', '#EAB308', 'Star', false, NOW(), NOW()),
('tag-white', 'white', 'Color tone', '#CBD5E1', 'Spark', false, NOW(), NOW()),
('tag-rose', 'rose', 'Color tone', '#F472B6', 'Droplet', false, NOW(), NOW()),
('tag-gold', 'gold', 'Metal family', '#F59E0B', 'Bullion', false, NOW(), NOW()),
('tag-silver', 'silver', 'Metal family', '#94A3B8', 'Ingot', false, NOW(), NOW()),
('tag-platinum', 'platinum', 'Metal family', '#64748B', 'Shield', false, NOW(), NOW()),
('tag-18k', '18k', 'Karat purity', '#F97316', 'Gem', false, NOW(), NOW()),
('tag-14k', '14k', 'Karat purity', '#EA580C', 'Gem', false, NOW(), NOW()),
('tag-wire', 'wire', 'Form factor', '#2563EB', 'Thread', false, NOW(), NOW()),
('tag-sheet', 'sheet', 'Form factor', '#4338CA', 'Ruler', false, NOW(), NOW()),
('tag-granules', 'granules', 'Form factor', '#A855F7', 'Crucible', false, NOW(), NOW()),
('tag-round', 'round', 'Stone shape', '#14B8A6', 'Diamond', false, NOW(), NOW()),
('tag-princess', 'princess', 'Stone shape', '#06B6D4', 'Diamond', false, NOW(), NOW()),
('tag-baguette', 'baguette', 'Stone shape', '#0EA5E9', 'Diamond', false, NOW(), NOW()),
('tag-casting', 'casting', 'Manufacturing process', '#F43F5E', 'Cast', false, NOW(), NOW()),
('tag-micro-pave', 'micro-pave', 'Setting style', '#22C55E', 'Diamond', false, NOW(), NOW()),
('tag-chain', 'chain', 'Assembly component', '#22C55E', 'Chain', false, NOW(), NOW()),
('tag-lobster', 'lobster-clasp', 'Closure style', '#16A34A', 'Chain', false, NOW(), NOW()),
('tag-sterling', 'sterling', 'Silver alloy family', '#0EA5E9', 'Ingot', false, NOW(), NOW()),
('tag-fine', 'fine', 'Purity descriptor', '#6366F1', 'Shield', false, NOW(), NOW());

INSERT INTO inventory_resources (id, category, type, sub_type, resource_type_id, resource_tags, icon, description, created_at, updated_at) VALUES
('res-metal-01', 'Metal', '18k yellow gold wire 1.0mm', '18k, yellow, gold, wire', 'rt-metal', '18k, yellow, gold, wire', '🪙', 'Round 18k yellow gold wire for ring shanks and jump rings', NOW(), NOW()),
('res-metal-02', 'Metal', '18k rose gold wire 0.8mm', '18k, rose, gold, wire', 'rt-metal', '18k, rose, gold, wire', '🪙', 'Soft-temper rose gold wire for decorative wraps', NOW(), NOW()),
('res-metal-03', 'Metal', '14k white gold wire 0.7mm', '14k, white, gold, wire', 'rt-metal', '14k, white, gold, wire', '🪙', 'White gold wire for pavé settings and prongs', NOW(), NOW()),
('res-metal-04', 'Metal', 'Sterling silver sheet 20ga', 'sterling, silver, sheet', 'rt-metal', 'sterling, silver, sheet', '🪙', '20 gauge sterling sheet for hand-fabricated pendants', NOW(), NOW()),
('res-metal-05', 'Metal', 'Fine silver sheet 24ga', 'fine, silver, sheet', 'rt-metal', 'fine, silver, sheet', '🪙', 'Fine silver sheet for enameling and texturing', NOW(), NOW()),
('res-metal-06', 'Metal', 'Platinum wire 0.9mm', 'platinum, wire', 'rt-metal', 'platinum, wire', '🪙', 'Platinum wire for premium engagement settings', NOW(), NOW()),
('res-metal-07', 'Metal', 'Silver granules 2mm', 'silver, granules', 'rt-metal', 'silver, granules', '🪙', 'Silver granules used in granulation work', NOW(), NOW()),
('res-metal-08', 'Metal', 'Gold casting grain 18k yellow', '18k, yellow, gold, granules, casting', 'rt-metal', '18k, yellow, gold, granules, casting', '🪙', '18k casting grain for custom cast components', NOW(), NOW()),
('res-metal-09', 'Metal', 'Palladium white alloy grain', 'white, palladium, casting', 'rt-metal', 'white, palladium, casting', '🪙', 'Palladium-rich white alloy grain for nickel-free casting', NOW(), NOW()),
('res-metal-10', 'Metal', 'Sterling silver round wire 1.2mm', 'sterling, silver, wire', 'rt-metal', 'sterling, silver, wire', '🪙', 'Sterling wire for chains, ear wires, and bails', NOW(), NOW()),

('res-stone-01', 'Stone', 'Round diamond 1.5mm VS', 'round, micro-pave', 'rt-stone', 'round, micro-pave', '💎', 'Melee diamonds for pavé and halo settings', NOW(), NOW()),
('res-stone-02', 'Stone', 'Round diamond 2.0mm VS', 'round', 'rt-stone', 'round', '💎', 'Round diamonds for shared-prong bands', NOW(), NOW()),
('res-stone-03', 'Stone', 'Princess diamond 3.0mm VS', 'princess', 'rt-stone', 'princess', '💎', 'Princess cuts for channel and solitaire settings', NOW(), NOW()),
('res-stone-04', 'Stone', 'Baguette diamond 3x1.5mm VS', 'baguette', 'rt-stone', 'baguette', '💎', 'Baguette side stones for Art Deco designs', NOW(), NOW()),
('res-stone-05', 'Stone', 'Round sapphire 2.0mm', 'round', 'rt-stone', 'round', '💎', 'Blue sapphire melee for accent patterns', NOW(), NOW()),
('res-stone-06', 'Stone', 'Round ruby 2.0mm', 'round', 'rt-stone', 'round', '💎', 'Ruby accents for eternity and cluster rings', NOW(), NOW()),
('res-stone-07', 'Stone', 'Emerald cut emerald 5x3mm', 'green, center-stone', 'rt-stone', 'green, center-stone', '💎', 'Center stones for vintage-inspired settings', NOW(), NOW()),
('res-stone-08', 'Stone', 'Pear lab diamond 6x4mm', 'pear, lab-grown', 'rt-stone', 'pear, lab-grown', '💎', 'Lab-grown pear diamonds for pendants and rings', NOW(), NOW()),
('res-stone-09', 'Stone', 'Black spinel round 2.5mm', 'round, black', 'rt-stone', 'round, black', '💎', 'Black spinel accents for contrast pieces', NOW(), NOW()),
('res-stone-10', 'Stone', 'Moonstone cabochon 8x6mm', 'cabochon', 'rt-stone', 'cabochon', '💎', 'Moonstone cabs for bezel-set artisan pieces', NOW(), NOW()),

('res-cast-01', 'Cast', 'Signet ring cast size 8', 'casting, model-x', 'rt-cast', 'casting, model-x', '🧩', 'Pre-cast signet ring body for engraving projects', NOW(), NOW()),
('res-cast-02', 'Cast', 'Halo ring cast 6.5mm center', 'casting, model-y', 'rt-cast', 'casting, model-y', '🧩', 'Halo ring body for round center stone mounts', NOW(), NOW()),
('res-cast-03', 'Cast', 'Pendant basket cast 10x8mm', 'casting, model-x', 'rt-cast', 'casting, model-x', '🧩', 'Basket pendant setting for oval center stones', NOW(), NOW()),
('res-cast-04', 'Cast', 'Stud earring cast 4-prong 5mm', 'casting', 'rt-cast', 'casting', '🧩', 'Matched cast pair for 5mm round stones', NOW(), NOW()),
('res-cast-05', 'Cast', 'Cufflink top cast round 15mm', 'casting', 'rt-cast', 'casting', '🧩', 'Round tops ready for solder-on cufflink backs', NOW(), NOW()),
('res-cast-06', 'Cast', 'Bezel cup cast 6mm', 'casting', 'rt-cast', 'casting', '🧩', 'Cast bezel cups for quick stone setting', NOW(), NOW()),
('res-cast-07', 'Cast', 'Charm base cast heart 12mm', 'casting, model-y', 'rt-cast', 'casting, model-y', '🧩', 'Heart charm blanks for personalized charms', NOW(), NOW()),
('res-cast-08', 'Cast', 'Cross pendant cast 22mm', 'casting', 'rt-cast', 'casting', '🧩', 'Cross pendant body for religious jewelry lines', NOW(), NOW()),
('res-cast-09', 'Cast', 'Ring shank cast comfort fit', 'casting', 'rt-cast', 'casting', '🧩', 'Comfort-fit cast shanks for bridal sets', NOW(), NOW()),
('res-cast-10', 'Cast', 'Cluster ring top cast 9-stone', 'casting, model-x', 'rt-cast', 'casting, model-x', '🧩', 'Cluster top cast for multi-stone ring heads', NOW(), NOW()),

('res-finding-01', 'Finding', 'Lobster clasp 9mm sterling', 'chain, lobster-clasp, sterling, silver', 'rt-finding', 'chain, lobster-clasp, sterling, silver', '🔗', 'Sterling lobster clasp for bracelets and necklaces', NOW(), NOW()),
('res-finding-02', 'Finding', 'Spring ring clasp 6mm 14k', 'chain, clasp, 14k, gold', 'rt-finding', 'chain, clasp, 14k, gold', '🔗', '14k spring ring clasp for fine chains', NOW(), NOW()),
('res-finding-03', 'Finding', 'Jump rings 5mm 18k yellow', 'chain, 18k, yellow, gold', 'rt-finding', 'chain, 18k, yellow, gold', '🔗', 'Open jump rings for assembly and repair', NOW(), NOW()),
('res-finding-04', 'Finding', 'French ear wires sterling', 'sterling, silver, wire', 'rt-finding', 'sterling, silver, wire', '🔗', 'Sterling fishhook ear wires for dangle earrings', NOW(), NOW()),
('res-finding-05', 'Finding', 'Ball posts 4mm 14k white', '14k, white, gold', 'rt-finding', '14k, white, gold', '🔗', '14k white gold earring posts with pads', NOW(), NOW()),
('res-finding-06', 'Finding', 'Butterfly backs 14k', '14k, gold', 'rt-finding', '14k, gold', '🔗', 'Earring backs for post earrings', NOW(), NOW()),
('res-finding-07', 'Finding', 'Box clasp double lock', 'clasp, chain', 'rt-finding', 'clasp, chain', '🔗', 'Secure double-lock clasp for tennis bracelets', NOW(), NOW()),
('res-finding-08', 'Finding', 'Tube hinges 10mm', 'hinge', 'rt-finding', 'hinge', '🔗', 'Tube hinges for lockets and articulated pieces', NOW(), NOW()),
('res-finding-09', 'Finding', 'Pendant bail pinch 7mm', 'bail', 'rt-finding', 'bail', '🔗', 'Pinch bails for attaching pendants to chains', NOW(), NOW()),
('res-finding-10', 'Finding', 'S-hook clasp forged', 'clasp, chain', 'rt-finding', 'clasp, chain', '🔗', 'Forged S-hooks for artisan necklace closures', NOW(), NOW()),

('res-consumable-01', 'Consumable', 'Hard solder wire 14k yellow', 'yellow, gold, wire', 'rt-consumable', 'yellow, gold, wire', '⚙', 'Hard-flow solder wire for high-temperature joins', NOW(), NOW()),
('res-consumable-02', 'Consumable', 'Medium solder wire 14k yellow', 'yellow, gold, wire', 'rt-consumable', 'yellow, gold, wire', '⚙', 'Medium-flow solder for general fabrication', NOW(), NOW()),
('res-consumable-03', 'Consumable', 'Easy solder wire sterling', 'sterling, silver, wire', 'rt-consumable', 'sterling, silver, wire', '⚙', 'Easy-flow solder wire for final assembly passes', NOW(), NOW()),
('res-consumable-04', 'Consumable', 'Boric acid flux powder', 'flux', 'rt-consumable', 'flux', '⚙', 'Flux powder for oxidation control during soldering', NOW(), NOW()),
('res-consumable-05', 'Consumable', 'Pickle solution sodium bisulfate', 'cleaning', 'rt-consumable', 'cleaning', '⚙', 'Pickle compound for post-solder oxidation removal', NOW(), NOW()),
('res-consumable-06', 'Consumable', 'Tripoli polishing compound', 'polishing', 'rt-consumable', 'polishing', '⚙', 'Tripoli bar for first-stage polishing', NOW(), NOW()),
('res-consumable-07', 'Consumable', 'Rouge polishing compound', 'polishing', 'rt-consumable', 'polishing', '⚙', 'Red rouge for final mirror polish', NOW(), NOW()),
('res-consumable-08', 'Consumable', 'Ultrasonic cleaner concentrate', 'cleaning', 'rt-consumable', 'cleaning', '⚙', 'Concentrate for ultrasonic jewelry cleaning tanks', NOW(), NOW()),
('res-consumable-09', 'Consumable', 'Investment powder fine cast', 'casting', 'rt-consumable', 'casting', '⚙', 'Fine investment powder for clean casting detail', NOW(), NOW()),
('res-consumable-10', 'Consumable', 'Silicone polishing wheels mixed grit', 'polishing', 'rt-consumable', 'polishing', '⚙', 'Mixed-grit silicone wheels for pre-polish shaping', NOW(), NOW());

INSERT INTO inventory_items (
    id,
    resource_id,
    resource_category,
    resource_type,
    resource_sub_type,
    resource_tags,
    resource_icon,
    resource_description,
    custom_tag_ids,
    available_quantity,
    pending_quantity,
    created_at,
    updated_at
) VALUES
('item-metal-01', 'res-metal-01', 'Metal', '18k yellow gold wire 1.0mm', '18k, yellow, gold, wire', '18k, yellow, gold, wire', '🪙', 'Round 18k yellow gold wire for ring shanks and jump rings', '', 42, 6, NOW(), NOW()),
('item-stone-01', 'res-stone-01', 'Stone', 'Round diamond 1.5mm VS', 'round, micro-pave', 'round, micro-pave', '💎', 'Melee diamonds for pavé and halo settings', '', 280, 35, NOW(), NOW()),
('item-cast-01', 'res-cast-01', 'Cast', 'Signet ring cast size 8', 'casting, model-x', 'casting, model-x', '🧩', 'Pre-cast signet ring body for engraving projects', '', 18, 4, NOW(), NOW()),
('item-finding-01', 'res-finding-01', 'Finding', 'Lobster clasp 9mm sterling', 'chain, lobster-clasp, sterling, silver', 'chain, lobster-clasp, sterling, silver', '🔗', 'Sterling lobster clasp for bracelets and necklaces', '', 120, 20, NOW(), NOW()),
('item-consumable-01', 'res-consumable-01', 'Consumable', 'Hard solder wire 14k yellow', 'yellow, gold, wire', 'yellow, gold, wire', '⚙', 'Hard-flow solder wire for high-temperature joins', '', 55, 8, NOW(), NOW());

UPDATE inventory_resources resource
SET icon = resource_type.icon,
    updated_at = NOW()
FROM inventory_resource_types resource_type
WHERE resource.resource_type_id = resource_type.id;

UPDATE inventory_items item
SET resource_icon = resource.icon,
    updated_at = NOW()
FROM inventory_resources resource
WHERE item.resource_id = resource.id;
"@

        Invoke-PostgresScript -Database "carousel_roles" -Script $inventorySql
        Write-ColorOutput "Green" "$CheckMark Inventory resource and item seed data inserted successfully"
        $stepSummary += @{ step = "Seed inventory resource and item data"; status = "Success"; error = "" }
} catch {
        Write-ColorOutput "Red" "$CrossMark Failed to seed inventory data: $($_.Exception.Message)"
        $stepSummary += @{ step = "Seed inventory resource and item data"; status = "Failed"; error = $($_.Exception.Message) }
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
Write-Host "    Roles: Support, PowerUser, InventoryManager, InventoryAdmin"
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
Write-Host "  Inventory Admin Access:" -ForegroundColor Cyan
Write-Host "    Email: ivy.morris@warehouse.io"
Write-Host "    Password: SecureTest@2024"
Write-Host "    AccessLevel: User"
Write-Host "    Roles: InventoryAdmin, InventoryManager"
Write-Host ""
Write-Host "  Inventory User Access:" -ForegroundColor Cyan
Write-Host "    Email: isaac.turner@warehouse.io"
Write-Host "    Password: SecureTest@2024"
Write-Host "    AccessLevel: User"
Write-Host "    Roles: InventoryUser"
Write-Host ""
Write-Host "  Pending Admin Approval:" -ForegroundColor Yellow
Write-Host "    david.brown@techstartup.io"
Write-Host "    emma.davis@innovate.co"
Write-Host ""
Write-ColorOutput "Yellow" "Note: Pending users are email-verified and have open approval requests in approval_requests"
Write-Host ""
