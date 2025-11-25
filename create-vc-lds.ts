/**
 * Create Verifiable Credential with Linked Data Signatures (lds)
 * Uses Veramo agent methods directly
 *
 * DIDs:
 * - Issuer: did:web:kiuyenzo.github.io:did:issuer
 * - Subject: did:web:kiuyenzo.github.io:did:nf-a
 *
 * Usage: node --loader tsx create-vc-lds.ts
 *        or use veramo execute method
 */

import { readFileSync } from 'fs'
import { load } from 'js-yaml'

async function createCredentialWithLds() {
  console.log('==========================================')
  console.log('Create VC with lds (Linked Data Signatures)')
  console.log('==========================================\n')

  // Note: This script is designed to show the logic
  // To actually run it, use: veramo execute -m createVerifiableCredential
  console.log('✓ Script loaded\n')

  const agent = null as any // Placeholder - use veramo CLI in practice

  // Configuration
  const issuerDid = 'did:web:kiuyenzo.github.io:did:issuer'
  const subjectDid = 'did:web:kiuyenzo.github.io:did:nf-a'

  try {
    // Step 1: Resolve DIDs
    console.log('Step 1: Resolving DIDs...')
    const issuerResolution = await agent.resolveDid({ didUrl: issuerDid })
    const subjectResolution = await agent.resolveDid({ didUrl: subjectDid })

    console.log(`  ✓ Issuer resolved: ${issuerDid}`)
    console.log(`  ✓ Subject resolved: ${subjectDid}\n`)

    // Step 2: Get issuer identifier from local database
    console.log('Step 2: Getting issuer identifier...')
    const issuerIdentifier = await agent.didManagerGet({ did: issuerDid })
    console.log(`  ✓ Issuer alias: ${issuerIdentifier.alias}`)
    console.log(`  ✓ Provider: ${issuerIdentifier.provider}\n`)

    // Step 3: Check verification methods
    console.log('Step 3: Checking verification methods...')
    const verificationMethods = issuerResolution.didDocument?.verificationMethod || []
    console.log(`  Found ${verificationMethods.length} verification method(s)`)

    verificationMethods.forEach((vm: any, index: number) => {
      console.log(`  ${index + 1}. Type: ${vm.type}`)
    })

    const hasEd25519 = verificationMethods.some((vm: any) =>
      vm.type.includes('Ed25519')
    )

    if (!hasEd25519) {
      console.log('  ⚠️  No Ed25519 key found in public DID document!')
      console.log('  ⚠️  This will likely fail.\n')
    } else {
      console.log('  ✓ Ed25519 key found\n')
    }

    // Step 4: Create Verifiable Credential
    console.log('Step 4: Creating Verifiable Credential...')
    const credential = await agent.createVerifiableCredential({
      credential: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://www.w3.org/2018/credentials/examples/v1'
        ],
        type: ['VerifiableCredential', 'Profile'],
        issuer: {
          id: issuerDid,
          name: 'Network Function Issuer'
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subjectDid,
          name: 'Alice',
          role: 'Network Function A',
          operator: 'Operator A',
          permissions: ['route', 'forward', 'filter']
        },
      },
      proofFormat: 'lds',
      save: true,
    })

    console.log('  ✓ Credential created\n')

    // Step 5: Save credential to database
    console.log('Step 5: Verifying credential is saved...')
    const savedCredentials = await agent.dataStoreORMGetVerifiableCredentials({
      where: [
        { column: 'issuer', value: [issuerDid] }
      ],
      order: [{ column: 'issuanceDate', direction: 'DESC' }],
      take: 1
    })

    if (savedCredentials.length > 0) {
      console.log('  ✓ Credential saved to database\n')
    }

    // Step 6: Display result
    console.log('==========================================')
    console.log('✅ SUCCESS!')
    console.log('==========================================\n')

    console.log('Verifiable Credential:')
    console.log('------------------------------------------')
    console.log(JSON.stringify(credential, null, 2))
    console.log('------------------------------------------\n')

    console.log('Credential Details:')
    console.log(`  Type: ${credential.type?.join(', ')}`)
    console.log(`  Issuer: ${credential.issuer}`)
    console.log(`  Subject: ${credential.credentialSubject.id}`)
    console.log(`  Proof Type: ${credential.proof?.type}`)
    console.log(`  Issuance Date: ${credential.issuanceDate}`)
    console.log('\n==========================================')

    return credential

  } catch (error: any) {
    console.error('\n==========================================')
    console.error('❌ ERROR')
    console.error('==========================================\n')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)

    if (error.message.includes('key_not_found')) {
      console.error('\n💡 Solution:')
      console.error('   Update DID documents on GitHub Pages with Ed25519 keys:')
      console.error('')
      console.error('   cp issuer-new-did.json issuer/did.json')
      console.error('   cp nf-a-new-did.json nf-a/did.json')
      console.error('   git add issuer/did.json nf-a/did.json')
      console.error('   git commit -m "Add Ed25519 keys for lds"')
      console.error('   git push')
      console.error('')
    }

    throw error
  }
}

// Run the script
createCredentialWithLds()
  .then(() => {
    console.log('✓ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('✗ Script failed')
    process.exit(1)
  })
