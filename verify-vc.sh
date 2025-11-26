#!/bin/bash

# Verify Verifiable Credential using Veramo agent
# Uses agent method: verifyCredential

set -e

echo "=========================================="
echo "Verify Verifiable Credential"
echo "=========================================="
echo ""

# Get the latest VC from database
echo "Step 1: Fetching latest credential from database..."
LATEST_VC=$(sqlite3 database.sqlite "SELECT raw FROM credential ORDER BY issuanceDate DESC LIMIT 1")

if [ -z "$LATEST_VC" ]; then
  echo "❌ No credential found in database"
  exit 1
fi

echo "✓ Credential found"
echo ""

# Save to temp file for verification
echo "$LATEST_VC" > /tmp/vc-to-verify.json

echo "Step 2: Credential details:"
echo "$LATEST_VC" | jq '{
  type: .type,
  issuer: .issuer.id,
  subject: .credentialSubject.id,
  proofType: .proof.type,
  issuanceDate: .issuanceDate
}'
echo ""

# Prepare verification arguments
cat > /tmp/verify-credential-args.json << VERIFY_EOF
{
  "credential": $LATEST_VC
}
VERIFY_EOF

echo "Step 3: Verifying credential..."
echo "  Using agent method: verifyCredential"
echo ""

# Verify using agent method
RESULT=$(veramo execute -m verifyCredential -f /tmp/verify-credential-args.json)

echo "Step 4: Verification result:"
echo "$RESULT" | jq '{
  verified: .verified,
  checks: .log,
  proofType: .results[0].proof.type,
  verificationMethod: .results[0].verificationMethod.type
}'

echo ""

# Check if verified
VERIFIED=$(echo "$RESULT" | jq -r '.verified')

if [ "$VERIFIED" = "true" ]; then
  echo "=========================================="
  echo "✅ VERIFICATION SUCCESSFUL"
  echo "=========================================="
  echo ""
  echo "All checks passed:"
  echo "$RESULT" | jq -r '.log[] | "  ✓ \(.id): \(.valid)"'
  echo ""
else
  echo "=========================================="
  echo "❌ VERIFICATION FAILED"
  echo "=========================================="
  exit 1
fi
