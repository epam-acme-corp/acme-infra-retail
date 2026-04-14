import * as authorization from "@pulumi/azure-native/authorization";
import { namespaceSpecs } from "./config";
import { namespaceIdentities } from "./identity";
import { resourceGroup } from "./networking";

const readerRoleDefinitionId = "acdd72a7-3385-48ef-bd42-f606fba81ae7";
const clientConfig = authorization.getClientConfigOutput();

function deterministicGuid(seed: string): string {
  const hex = Buffer.from(seed).toString("hex").padEnd(32, "0").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export const namespaceReaderAssignments = namespaceSpecs.map((namespaceSpec) => {
  const roleAssignmentName = deterministicGuid(`retail-${namespaceSpec.name}-reader`);

  return new authorization.RoleAssignment(`ra-${namespaceSpec.name}-reader`, {
    roleAssignmentName,
    principalId: namespaceIdentities[namespaceSpec.name].principalId,
    principalType: "ServicePrincipal",
    scope: resourceGroup.id,
    roleDefinitionId: clientConfig.subscriptionId.apply(
      (subscriptionId) =>
        `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${readerRoleDefinitionId}`,
    ),
  });
});
