#!/bin/bash

# Create Verifiable Credential with Linked Data Signatures (lds)
# Uses Veramo CLI and agent methods

set -e

echo "=========================================="
echo "Create VC with lds"
echo "=========================================="
echo ""

ISSUER_DID="did:web:kiuyenzo.github.io:did:issuer"
SUBJECT_DID="did:web:kiuyenzo.github.io:did:nf-a"

echo "Configuration:"
echo "  Issuer:  $ISSUER_DID"
echo "  Subject: $SUBJECT_DID"
echo "  Format:  lds (Linked Data Signatures)"
echo ""

# Step 1: Resolve DIDs
echo "Step 1: Resolving DIDs..."
echo "  Resolving issuer..."
veramo did resolve "$ISSUER_DID" > /tmp/issuer-did.json
echo "  ✓ Issuer resolved"

echo "  Resolving subject..."
veramo did resolve "$SUBJECT_DID" > /tmp/subject-did.json
echo "  ✓ Subject resolved"
echo ""

# Step 2: Check for Ed25519 keys
echo "Step 2: Checking for Ed25519 keys..."
if grep -q "Ed25519" /tmp/issuer-did.json; then
  echo "  ✓ Ed25519 key found in issuer DID"
else
  echo "  ⚠️  No Ed25519 key found!"
  echo "  ⚠️  This will fail. Update DID documents first."
  echo ""
fi
echo ""

# Step 3: Create Verifiable Credential
echo "Step 3: Creating Verifiable Credential..."
echo "  Using agent method: createVerifiableCredential"
echo ""

# Create JSON file with arguments
cat > /tmp/vc-args.json << EOF
{
  "credential": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://veramo.io/contexts/profile/v1"
    ],
    "type": ["VerifiableCredential", "Profile"],
    "issuer": {
      "id": "$ISSUER_DID"
    },
    "issuanceDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "credentialSubject": {
      "id": "$SUBJECT_DID",
      "name": "Alice"
    }
  },
  "proofFormat": "lds",
  "save": true
}
EOF

veramo execute -m createVerifiableCredential -f /tmp/vc-args.json

echo ""
echo "=========================================="
echo "✅ SUCCESS!"
echo "=========================================="
echo ""

# Step 4: List saved credentials
echo "Verifying credential is saved..."

cat > /tmp/query-args.json << EOF
{
  "where": [
    {"column": "issuer", "value": ["$ISSUER_DID"]}
  ],
  "order": [{"column": "issuanceDate", "direction": "DESC"}],
  "take": 1
}
EOF

veramo execute -m dataStoreORMGetVerifiableCredentials -f /tmp/query-args.json

echo ""
echo "✓ Credential saved to database"
echo "=========================================="
