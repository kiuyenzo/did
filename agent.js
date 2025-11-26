"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agent = void 0;
// Core interfaces
var core_1 = require("@veramo/core");
// Core identity manager plugin
var did_manager_1 = require("@veramo/did-manager");
// Ethr did identity provider
var did_provider_ethr_1 = require("@veramo/did-provider-ethr");
// Web did identity provider
var did_provider_web_1 = require("@veramo/did-provider-web");
// Key did identity provider
var did_provider_key_1 = require("@veramo/did-provider-key");
// Jwk did identity provider
var did_provider_jwk_1 = require("@veramo/did-provider-jwk");
// Peer did identity provider
var did_provider_peer_1 = require("@veramo/did-provider-peer");
// Core key manager plugin
var key_manager_1 = require("@veramo/key-manager");
// Custom key management system for RN
var kms_local_1 = require("@veramo/kms-local");
// W3C Verifiable Credential plugin
var credential_w3c_1 = require("@veramo/credential-w3c");
// Ed25519Signature2020 Linked Data Signature suite
var credential_ld_1 = require("@veramo/credential-ld");
// Custom resolvers
var did_resolver_1 = require("@veramo/did-resolver");
var did_resolver_2 = require("did-resolver");
var ethr_did_resolver_1 = require("ethr-did-resolver");
var web_did_resolver_1 = require("web-did-resolver");
var key_did_resolver_1 = require("key-did-resolver");
// Storage plugin using TypeOrm
var data_store_1 = require("@veramo/data-store");
// Plugin for DID Discovery
var did_discovery_1 = require("@veramo/did-discovery");
// TypeORM is installed with `@veramo/data-store`
var typeorm_1 = require("typeorm");
// You will need to get a project ID from infura https://www.infura.io
var INFURA_PROJECT_ID = 'your-infura-project-id';
// This will be the secret key for the KMS
var KMS_SECRET_KEY = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';
// DB SQLite local
var dbConnection = new typeorm_1.DataSource({
    type: 'sqlite',
    database: './database.sqlite',
    synchronize: false,
    migrations: data_store_1.migrations,
    migrationsRun: true,
    logging: false,
    entities: data_store_1.Entities,
}).initialize();
exports.agent = (0, core_1.createAgent)({
    plugins: [
        new key_manager_1.KeyManager({
            store: new data_store_1.KeyStore(dbConnection),
            kms: {
                local: new kms_local_1.KeyManagementSystem(new data_store_1.PrivateKeyStore(dbConnection, new kms_local_1.SecretBox(KMS_SECRET_KEY))),
            },
        }),
        new did_manager_1.DIDManager({
            store: new data_store_1.DIDStore(dbConnection),
            defaultProvider: "did:ethr:goerli",
            providers: {
                "did:ethr:goerli": new did_provider_ethr_1.EthrDIDProvider({
                    defaultKms: "local",
                    network: "goerli",
                    rpcUrl: "https://goerli.infura.io/v3/" + INFURA_PROJECT_ID,
                }),
                "did:web": new did_provider_web_1.WebDIDProvider({
                    defaultKms: "local",
                }),
                "did:jwk": new did_provider_jwk_1.JwkDIDProvider({
                    defaultKms: "local",
                }),
                "did:key": new did_provider_key_1.KeyDIDProvider({
                    defaultKms: "local",
                }),
                "did:peer": new did_provider_peer_1.PeerDIDProvider({
                    defaultKms: "local",
                }),
            },
        }),
        new did_resolver_1.DIDResolverPlugin({
            resolver: new did_resolver_2.Resolver(__assign(__assign(__assign(__assign(__assign({}, (0, ethr_did_resolver_1.getResolver)({ infuraProjectId: INFURA_PROJECT_ID })), (0, web_did_resolver_1.getResolver)()), (0, did_provider_jwk_1.getDidJwkResolver)()), (0, key_did_resolver_1.getResolver)()), (0, did_provider_peer_1.getResolver)())),
        }),
        new data_store_1.DataStore(dbConnection),
        new data_store_1.DataStoreORM(dbConnection), // Mostly for internal use such as migrations
        new credential_w3c_1.CredentialPlugin(),
        new credential_ld_1.CredentialIssuerLD({
            contextMaps: [credential_ld_1.LdDefaultContexts],
            suites: [new credential_ld_1.VeramoEcdsaSecp256k1RecoverySignature2020(), new credential_ld_1.VeramoEd25519Signature2020()],
        }),
        new did_discovery_1.DIDDiscovery({
            providers: [
                new did_manager_1.AliasDiscoveryProvider(),
                new data_store_1.DataStoreDiscoveryProvider(),
            ],
        }),
    ],
});
