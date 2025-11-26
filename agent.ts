// Core interfaces
import {
    createAgent,
    IDIDManager,
    IResolver,
    IDataStore,
    IDataStoreORM,
    IKeyManager,
    ICredentialPlugin,
} from '@veramo/core'

// Core identity manager plugin
import { AliasDiscoveryProvider, DIDManager } from "@veramo/did-manager";

// Ethr did identity provider
import { EthrDIDProvider } from "@veramo/did-provider-ethr";

// Web did identity provider
import { WebDIDProvider } from "@veramo/did-provider-web";

// Key did identity provider
import { KeyDIDProvider } from "@veramo/did-provider-key";

// Jwk did identity provider
import { getDidJwkResolver as jwkDidResolver, JwkDIDProvider } from "@veramo/did-provider-jwk";

// Peer did identity provider
import { getResolver as peerDIDResolver, PeerDIDProvider } from "@veramo/did-provider-peer";

// Core key manager plugin
import { KeyManager } from "@veramo/key-manager";

// Custom key management system for RN
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local";

// W3C Verifiable Credential plugin
import { CredentialPlugin } from "@veramo/credential-w3c";

// Ed25519Signature2020 Linked Data Signature suite
import {
    CredentialIssuerLD,
    ICredentialIssuerLD,
    LdDefaultContexts,
    VeramoEcdsaSecp256k1RecoverySignature2020,
    VeramoEd25519Signature2018,
    VeramoEd25519Signature2020,
} from "@veramo/credential-ld";

// Custom resolvers
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { Resolver } from "did-resolver";
import { getResolver as ethrDidResolver } from "ethr-did-resolver";
import { getResolver as webDidResolver } from "web-did-resolver";
import { getResolver as keyDidResolver } from "key-did-resolver";

// Storage plugin using TypeOrm
import {
    Entities,
    KeyStore,
    DataStore,
    DataStoreDiscoveryProvider,
    DataStoreORM,
    DIDStore,
    PrivateKeyStore,
    migrations,
} from "@veramo/data-store";

// Plugin for DID Discovery
import { DIDDiscovery, IDIDDiscovery } from "@veramo/did-discovery";

// TypeORM is installed with `@veramo/data-store`
import { DataSource } from "typeorm";

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = 'your-infura-project-id';
// This will be the secret key for the KMS
const KMS_SECRET_KEY = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';

// DB SQLite local
const dbConnection = new DataSource({
    type: 'sqlite',
    database: './database.sqlite',
    synchronize: false,
    migrations,
    migrationsRun: true,
    logging: false,
    entities: Entities,
}).initialize();

export const agent = createAgent<
    IDIDManager &
    IKeyManager &
    IDataStore &
    IDataStoreORM &
    IResolver &
    ICredentialPlugin &
    ICredentialIssuerLD &
    IDIDDiscovery
>({
    plugins: [
        new KeyManager({
            store: new KeyStore(dbConnection),
            kms: {
                local: new KeyManagementSystem(
                    new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY))
                ),
            },
        }),
        new DIDManager({
            store: new DIDStore(dbConnection),
            defaultProvider: "did:ethr:goerli",
            providers: {
                "did:ethr:goerli": new EthrDIDProvider({
                    defaultKms: "local",
                    network: "goerli",
                    rpcUrl: "https://goerli.infura.io/v3/" + INFURA_PROJECT_ID,
                }),
                "did:web": new WebDIDProvider({
                    defaultKms: "local",
                }),
                "did:jwk": new JwkDIDProvider({
                    defaultKms: "local",
                }),
                "did:key": new KeyDIDProvider({
                    defaultKms: "local",
                }),
                "did:peer": new PeerDIDProvider({
                    defaultKms: "local",
                }),
            },
        }),
        new DIDResolverPlugin({
            resolver: new Resolver({
                ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
                ...webDidResolver(),
                ...jwkDidResolver(),
                ...keyDidResolver(),
                ...peerDIDResolver(),
            }),
        }),
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection), // Mostly for internal use such as migrations
        new CredentialPlugin(),
        new CredentialIssuerLD({
            contextMaps: [LdDefaultContexts],
            suites: [new VeramoEcdsaSecp256k1RecoverySignature2020(), new VeramoEd25519Signature2020()],
        }),
        new DIDDiscovery({
            providers: [
                new AliasDiscoveryProvider(),
                new DataStoreDiscoveryProvider(),
            ],
        }),
    ],
});