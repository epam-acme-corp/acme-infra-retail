import * as managedidentity from "@pulumi/azure-native/managedidentity";
import { namespaceSpecs, tags } from "./config";
import { resourceGroup } from "./networking";

export const namespaceIdentities = Object.fromEntries(
  namespaceSpecs.map((namespaceSpec) => {
    const identity = new managedidentity.UserAssignedIdentity(`id-acme-retail-${namespaceSpec.name}`, {
      resourceGroupName: resourceGroup.name,
      resourceName: `id-acme-retail-${namespaceSpec.name}`,
      tags: {
        ...tags,
        namespace: namespaceSpec.name,
      },
    });

    return [namespaceSpec.name, identity];
  }),
);
