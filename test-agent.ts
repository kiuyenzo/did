import { agent } from './agent.js';

async function main() {
    console.log('🚀 Starting Veramo Agent...\n');

    // // 1. Liste alle existierenden DIDs auf
    // console.log('📋 Existing DIDs:');
    // const existingDids = await agent.didManagerFind();
    // if (existingDids.length > 0) {
    //     existingDids.forEach((did, index) => {
    //         console.log(`  ${index + 1}. ${did.did} (${did.provider})`);
    //         if (did.alias) console.log(`     Alias: ${did.alias}`);
    //     });
    // } else {
    //     console.log('  No DIDs found in database.');
    // }
    // console.log();

    // 2. Erstelle eine neue DID (did:key - funktioniert offline, kein Infura nötig)
    console.log('✨ Creating a new did:key DID...');
    try {
        const newDid = await agent.didManagerCreate({
            provider: 'did:key',
            alias: 'test-did-' + Date.now()
        });
        console.log(`  ✓ Created: ${newDid.did}`);
        console.log(`  ✓ Alias: ${newDid.alias}`);
        console.log(`  ✓ Provider: ${newDid.provider}`);
    } catch (error) {
        console.error('  ✗ Error creating DID:', error.message);
    }
    console.log();

    // 3. Liste alle DIDs nochmal auf
    console.log('📋 Updated DID list:');
    const updatedDids = await agent.didManagerFind();
    updatedDids.forEach((did, index) => {
        console.log(`  ${index + 1}. ${did.did}`);
        if (did.alias) console.log(`     Alias: ${did.alias}`);
    });
    console.log();

    // 4. Resolve eine DID
    if (updatedDids.length > 0) {
        const didToResolve = updatedDids[0].did;
        console.log(`🔍 Resolving DID: ${didToResolve}`);
        try {
            const resolution = await agent.resolveDid({ didUrl: didToResolve });
            console.log('  ✓ DID Document:');
            console.log(JSON.stringify(resolution.didDocument, null, 2));
        } catch (error) {
            console.error('  ✗ Error resolving DID:', error.message);
        }
    }

    console.log('\n✅ Done!');
    process.exit(0);
}

main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});
