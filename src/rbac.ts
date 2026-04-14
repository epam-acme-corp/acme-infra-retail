import * as crypto from "crypto";
import * as pulumi from "@pulumi/pulumi";
import * as authorization from "@pulumi/azure-native/authorization";
import {
  hubAcrResourceId,
  namespaceSpecs,
  namespaceUserGroupObjectIds,
  opcoPlatformGroupObjectId,
  opcoReadOnlyGroupObjectId,
} from "./config";
import { aksCluster } from "./aks";
import { hubOutputs, resourceGroup } from "./networking";

const aksClusterAdminRoleDefinitionId = "0ab0b1a8-8aac-4efd-b8c2-3ee1fb270be8";
const aksClusterUserRoleDefinitionId = "4abbcc35-e782-43d8-92c5-2d3f1bd2253f";
const readerRoleDefinitionId = "acdd72a7-3385-48ef-bd42-f606fba81ae7";
const acrPullRoleDefinitionId = "7f951dda-4ed3-4680-a7ca-43fe172d538d";

function deterministicGuid(seed: string): string {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function roleDefinitionId(scope: pulumi.Input<string>, roleId: string): pulumi.Output<string> {
  return pulumi.output(scope).apply((scopeId) => `${scopeId}/providers/Microsoft.Authorization/roleDefinitions/${roleId}`);
}

new authorization.RoleAssignment("ra-retail-aks-cluster-admin", {
  principalId: opcoPlatformGroupObjectId,
  principalType: "Group",
  scope: aksCluster.id,
  roleDefinitionId: roleDefinitionId(aksCluster.id, aksClusterAdminRoleDefinitionId),
  roleAssignmentName: deterministicGuid("retail-aks-cluster-admin"),
});

new authorization.RoleAssignment("ra-retail-rg-reader", {
  principalId: opcoReadOnlyGroupObjectId,
  principalType: "Group",
  scope: resourceGroup.id,
  roleDefinitionId: roleDefinitionId(resourceGroup.id, readerRoleDefinitionId),
  roleAssignmentName: deterministicGuid("retail-rg-reader"),
});

for (const namespaceSpec of namespaceSpecs) {
  const namespaceGroupId = namespaceUserGroupObjectIds[namespaceSpec.name] ?? "33333333-3333-3333-3333-333333333333";

  new authorization.RoleAssignment(`ra-${namespaceSpec.name}-aks-user`, {
    principalId: namespaceGroupId,
    principalType: "Group",
    scope: aksCluster.id,
    roleDefinitionId: roleDefinitionId(aksCluster.id, aksClusterUserRoleDefinitionId),
    roleAssignmentName: deterministicGuid(`retail-${namespaceSpec.name}-aks-user`),
  });
}

const kubeletObjectId = aksCluster.identityProfile.apply((identityProfile) => identityProfile?.kubeletidentity?.objectId ?? "");
const hubAcrId = pulumi
  .output(hubOutputs.acrId)
  .apply((value) => (typeof value === "string" && value.length > 0 ? value : hubAcrResourceId));

new authorization.RoleAssignment("ra-retail-kubelet-acrpull", {
  principalId: kubeletObjectId,
  principalType: "ServicePrincipal",
  scope: hubAcrId,
  roleDefinitionId: roleDefinitionId(hubAcrId, acrPullRoleDefinitionId),
  roleAssignmentName: deterministicGuid("retail-kubelet-acrpull"),
});
