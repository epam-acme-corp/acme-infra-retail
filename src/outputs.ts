import { aksCluster, gpuPool, pciPool, workloadPool } from "./aks";
import {
  inventoryPostgres,
  inventoryPostgresPrivateEndpoint,
  loyaltyCosmos,
  loyaltyCosmosPrivateEndpoint,
  orderPostgres,
  orderPostgresPrivateEndpoint,
  recommendationRedis,
  recommendationRedisPrivateEndpoint,
} from "./databases";
import { namespaceIdentities } from "./identity";
import { namespaces } from "./namespaces";
import { hubToSpokePeering, resourceGroup, spokeToHubPeering, spokeVnet } from "./networking";

export const spokeResourceGroupName = resourceGroup.name;
export const spokeVnetId = spokeVnet.id;
export const spokeVnetName = spokeVnet.name;
export const aksClusterName = aksCluster.name;
export const aksNodeResourceGroup = aksCluster.nodeResourceGroup;

export const nodePools = {
  workload: workloadPool.name,
  gpu: gpuPool.name,
  pci: pciPool.name,
};

export const namespaceNames = Object.keys(namespaces);
export const managedIdentityClientIds = Object.fromEntries(
  Object.entries(namespaceIdentities).map(([namespace, identity]) => [namespace, identity.clientId]),
);

export const databases = {
  inventoryPostgresId: inventoryPostgres.id,
  orderPostgresId: orderPostgres.id,
  loyaltyCosmosId: loyaltyCosmos.id,
  recommendationRedisId: recommendationRedis.id,
};

export const privateEndpoints = {
  inventoryPostgres: inventoryPostgresPrivateEndpoint.id,
  orderPostgres: orderPostgresPrivateEndpoint.id,
  loyaltyCosmos: loyaltyCosmosPrivateEndpoint.id,
  recommendationRedis: recommendationRedisPrivateEndpoint.id,
};

export const peerings = {
  spokeToHub: spokeToHubPeering.id,
  hubToSpoke: hubToSpokePeering.id,
};
