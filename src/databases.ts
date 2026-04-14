import * as documentdb from "@pulumi/azure-native/documentdb";
import * as dbforpostgresql from "@pulumi/azure-native/dbforpostgresql";
import * as network from "@pulumi/azure-native/network";
import * as cache from "@pulumi/azure-native/cache";
import * as random from "@pulumi/random";
import { managedDatabaseNames, tags } from "./config";
import { privateEndpointsSubnet, resourceGroup } from "./networking";

const postgresAdminPassword = new random.RandomPassword("postgres-admin-password", {
  length: 24,
  special: true,
  overrideSpecial: "!#$%&*()-_=+[]{}",
});

export const inventoryPostgres = new dbforpostgresql.Server(managedDatabaseNames.inventoryPostgres, {
  resourceName: managedDatabaseNames.inventoryPostgres,
  resourceGroupName: resourceGroup.name,
  administratorLogin: "pgadminacme",
  administratorLoginPassword: postgresAdminPassword.result,
  version: "15",
  sku: {
    name: "Standard_D4ds_v5",
    tier: "GeneralPurpose",
  },
  storage: {
    storageSizeGB: 256,
    autoGrow: "Enabled",
  },
  network: {
    publicNetworkAccess: "Disabled",
  },
  backup: {
    backupRetentionDays: 14,
    geoRedundantBackup: "Enabled",
  },
  tags,
} as any);

export const orderPostgres = new dbforpostgresql.Server(managedDatabaseNames.orderPostgres, {
  resourceName: managedDatabaseNames.orderPostgres,
  resourceGroupName: resourceGroup.name,
  administratorLogin: "pgadminacme",
  administratorLoginPassword: postgresAdminPassword.result,
  version: "15",
  sku: {
    name: "Standard_D4ds_v5",
    tier: "GeneralPurpose",
  },
  storage: {
    storageSizeGB: 256,
    autoGrow: "Enabled",
  },
  network: {
    publicNetworkAccess: "Disabled",
  },
  backup: {
    backupRetentionDays: 14,
    geoRedundantBackup: "Enabled",
  },
  tags,
} as any);

export const loyaltyCosmos = new documentdb.DatabaseAccount(managedDatabaseNames.loyaltyCosmos, {
  accountName: managedDatabaseNames.loyaltyCosmos,
  resourceGroupName: resourceGroup.name,
  locations: [{ locationName: resourceGroup.location, failoverPriority: 0 }],
  databaseAccountOfferType: "Standard",
  kind: "MongoDB",
  consistencyPolicy: {
    defaultConsistencyLevel: "Session",
  },
  disableLocalAuth: true,
  publicNetworkAccess: "Disabled",
  enableAutomaticFailover: true,
  capabilities: [{ name: "EnableMongo" }],
  tags,
} as any);

export const recommendationRedis = new cache.RedisEnterprise(managedDatabaseNames.recommendationRedis, {
  clusterName: managedDatabaseNames.recommendationRedis,
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  sku: {
    name: "Enterprise_E10-2",
    capacity: 2,
  },
  zones: ["1", "2", "3"],
  minimumTlsVersion: "1.2",
  tags,
} as any);

export const recommendationRedisDb = new cache.Database("redis-recommendation-db", {
  clusterName: recommendationRedis.name,
  databaseName: "default",
  resourceGroupName: resourceGroup.name,
  clientProtocol: "Encrypted",
  clusteringPolicy: "OSSCluster",
  evictionPolicy: "VolatileLRU",
  modules: [{ name: "RediSearch", args: "PARTITIONS AUTO" }],
  persistence: {
    aofEnabled: true,
    rdbEnabled: true,
  },
  port: 10000,
} as any);

function createPrivateEndpoint(
  endpointName: string,
  targetResourceId: string | import("@pulumi/pulumi").Output<string>,
  groupId: string,
) {
  return new network.PrivateEndpoint(endpointName, {
    privateEndpointName: endpointName,
    resourceGroupName: resourceGroup.name,
    subnet: {
      id: privateEndpointsSubnet.id,
    },
    privateLinkServiceConnections: [
      {
        name: `${endpointName}-pls`,
        privateLinkServiceId: targetResourceId,
        groupIds: [groupId],
      },
    ],
    customNetworkInterfaceName: `${endpointName}-nic`,
    tags,
  });
}

export const inventoryPostgresPrivateEndpoint = createPrivateEndpoint(
  "pep-psql-inventory",
  inventoryPostgres.id,
  "postgresqlServer",
);

export const orderPostgresPrivateEndpoint = createPrivateEndpoint(
  "pep-psql-order",
  orderPostgres.id,
  "postgresqlServer",
);

export const loyaltyCosmosPrivateEndpoint = createPrivateEndpoint(
  "pep-cosmos-loyalty",
  loyaltyCosmos.id,
  "MongoDB",
);

export const recommendationRedisPrivateEndpoint = createPrivateEndpoint(
  "pep-redis-recommendation",
  recommendationRedis.id,
  "redisEnterprise",
);
