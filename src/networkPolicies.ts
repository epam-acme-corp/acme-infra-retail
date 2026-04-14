import * as k8s from "@pulumi/kubernetes";
import {
  approvedPciIngressNamespaces,
  databaseEgressPorts,
  databasePrivateEndpointCidrs,
  hubFirewallPrivateIp,
  namespaceSpecs,
} from "./config";
import { kubernetesProvider } from "./namespaces";

for (const namespaceSpec of namespaceSpecs) {
  new k8s.networking.v1.NetworkPolicy(
    `${namespaceSpec.name}-default-deny`,
    {
      metadata: { name: "default-deny", namespace: namespaceSpec.name },
      spec: {
        podSelector: {},
        policyTypes: ["Ingress", "Egress"],
      },
    },
    { provider: kubernetesProvider },
  );

  new k8s.networking.v1.NetworkPolicy(
    `${namespaceSpec.name}-allow-ingress-nginx`,
    {
      metadata: { name: "allow-ingress-nginx", namespace: namespaceSpec.name },
      spec: {
        podSelector: {},
        policyTypes: ["Ingress"],
        ingress: [
          {
            from: [
              {
                namespaceSelector: {
                  matchLabels: {
                    "kubernetes.io/metadata.name": "ingress-nginx",
                  },
                },
              },
            ],
          },
        ],
      },
    },
    { provider: kubernetesProvider },
  );

  new k8s.networking.v1.NetworkPolicy(
    `${namespaceSpec.name}-allow-egress-platform`,
    {
      metadata: { name: "allow-egress-platform", namespace: namespaceSpec.name },
      spec: {
        podSelector: {},
        policyTypes: ["Egress"],
        egress: [
          {
            to: [
              {
                namespaceSelector: {
                  matchLabels: {
                    "kubernetes.io/metadata.name": "kube-system",
                  },
                },
                podSelector: {
                  matchLabels: {
                    "k8s-app": "kube-dns",
                  },
                },
              },
            ],
            ports: [
              { protocol: "UDP", port: 53 },
              { protocol: "TCP", port: 53 },
            ],
          },
          ...databasePrivateEndpointCidrs.map((cidr) => ({
            to: [{ ipBlock: { cidr } }],
            ports: databaseEgressPorts.map((port) => ({ protocol: "TCP", port })),
          })),
          {
            to: [{ ipBlock: { cidr: `${hubFirewallPrivateIp}/32` } }],
            ports: [{ protocol: "TCP", port: 443 }],
          },
        ],
      },
    },
    { provider: kubernetesProvider },
  );

  if (namespaceSpec.compliance === "pci-dss") {
    new k8s.networking.v1.NetworkPolicy(
      `${namespaceSpec.name}-pci-ingress`,
      {
        metadata: { name: "allow-pci-approved-namespaces", namespace: namespaceSpec.name },
        spec: {
          podSelector: {},
          policyTypes: ["Ingress"],
          ingress: [
            {
              from: approvedPciIngressNamespaces.map((approvedNamespace) => ({
                namespaceSelector: {
                  matchLabels: {
                    "kubernetes.io/metadata.name": approvedNamespace,
                  },
                },
              })),
            },
          ],
        },
      },
      { provider: kubernetesProvider },
    );
  }
}
