import * as k8s from "@pulumi/kubernetes";
import { namespaceSpecs } from "./config";
import { namespaceIdentities } from "./identity";
import { kubeconfig } from "./aks";

export const kubernetesProvider = new k8s.Provider("aks-retail-provider", {
  kubeconfig,
});

export const namespaces = Object.fromEntries(
  namespaceSpecs.map((namespaceSpec) => {
    const ns = new k8s.core.v1.Namespace(
      `ns-${namespaceSpec.name}`,
      {
        metadata: {
          name: namespaceSpec.name,
          labels: {
            "acme.corp/domain": namespaceSpec.name,
            "acme.corp/runtime-family": namespaceSpec.runtime.toLowerCase().includes("python")
              ? "python"
              : namespaceSpec.runtime.toLowerCase().includes("node")
                ? "node"
                : "dotnet",
            "acme.corp/data-class": namespaceSpec.dataTier.toLowerCase().includes("postgresql")
              ? "postgresql"
              : namespaceSpec.dataTier.toLowerCase().includes("mongodb")
                ? "mongodb"
                : namespaceSpec.dataTier.toLowerCase().includes("redis")
                  ? "redis"
                  : namespaceSpec.dataTier.toLowerCase().includes("elasticsearch")
                    ? "elasticsearch"
                    : "sqlserver",
            ...(namespaceSpec.compliance ? { "acme.corp/compliance": namespaceSpec.compliance } : {}),
            ...(namespaceSpec.affinity ? { "acme.corp/affinity": namespaceSpec.affinity } : {}),
          },
          annotations: {
            "acme.corp/description": namespaceSpec.description,
            "acme.corp/runtime": namespaceSpec.runtime,
            "acme.corp/data-tier": namespaceSpec.dataTier,
          },
        },
      },
      { provider: kubernetesProvider },
    );

    const serviceAccount = new k8s.core.v1.ServiceAccount(
      `sa-${namespaceSpec.name}`,
      {
        metadata: {
          name: `sa-${namespaceSpec.name}-wi`,
          namespace: ns.metadata.name,
          annotations: {
            "azure.workload.identity/client-id": namespaceIdentities[namespaceSpec.name].clientId,
          },
          labels: {
            "azure.workload.identity/use": "true",
          },
        },
      },
      { provider: kubernetesProvider },
    );

    return [namespaceSpec.name, { namespace: ns, serviceAccount }];
  }),
);
