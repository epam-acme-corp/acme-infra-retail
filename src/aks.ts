import * as pulumi from "@pulumi/pulumi";
import * as containerservice from "@pulumi/azure-native/containerservice";
import { naming, tags } from "./config";
import { aksGpuSubnet, aksSystemSubnet, aksWorkloadSubnet, resourceGroup } from "./networking";

export const aksCluster = new containerservice.ManagedCluster(naming.aks, {
  resourceGroupName: resourceGroup.name,
  resourceName: naming.aks,
  dnsPrefix: "acme-retail",
  kubernetesVersion: "1.30",
  identity: {
    type: "SystemAssigned",
  },
  sku: {
    tier: "Standard",
    name: "Base",
  },
  oidcIssuerProfile: {
    enabled: true,
  },
  securityProfile: {
    workloadIdentity: {
      enabled: true,
    },
  } as any,
  agentPoolProfiles: [
    {
      name: "system",
      mode: "System",
      vmSize: "Standard_D4s_v5",
      osType: "Linux",
      osSKU: "AzureLinux",
      type: "VirtualMachineScaleSets",
      count: 2,
      enableAutoScaling: true,
      minCount: 2,
      maxCount: 5,
      vnetSubnetID: aksSystemSubnet.id,
      orchestratorVersion: "1.30",
      nodeLabels: {
        role: "system",
      },
    } as any,
  ],
  networkProfile: {
    networkPlugin: "azure",
    networkPluginMode: "Overlay",
    networkPolicy: "azure",
    outboundType: "loadBalancer",
    loadBalancerSku: "standard",
    serviceCidr: "172.18.0.0/16",
    dnsServiceIP: "172.18.0.10",
    podCidr: "172.19.0.0/16",
  } as any,
  apiServerAccessProfile: {
    enablePrivateCluster: true,
  },
  tags,
});

export const workloadPool = new containerservice.AgentPool("ap-workload", {
  resourceGroupName: resourceGroup.name,
  resourceName: naming.aks,
  agentPoolName: "workload",
  mode: "User",
  vmSize: "Standard_D8s_v5",
  osType: "Linux",
  osSKU: "AzureLinux",
  type: "VirtualMachineScaleSets",
  count: 3,
  enableAutoScaling: true,
  minCount: 3,
  maxCount: 12,
  vnetSubnetID: aksWorkloadSubnet.id,
  orchestratorVersion: "1.30",
  nodeLabels: {
    role: "workload",
  },
} as any);

export const gpuPool = new containerservice.AgentPool("ap-gpu", {
  resourceGroupName: resourceGroup.name,
  resourceName: naming.aks,
  agentPoolName: "gpu",
  mode: "User",
  vmSize: "Standard_NC6s_v3",
  osType: "Linux",
  osSKU: "AzureLinux",
  type: "VirtualMachineScaleSets",
  count: 1,
  enableAutoScaling: true,
  minCount: 1,
  maxCount: 3,
  vnetSubnetID: aksGpuSubnet.id,
  orchestratorVersion: "1.30",
  nodeLabels: {
    role: "recommendation-gpu",
  },
  nodeTaints: ["workload=gpu:NoSchedule"],
} as any);

export const pciPool = new containerservice.AgentPool("ap-pci", {
  resourceGroupName: resourceGroup.name,
  resourceName: naming.aks,
  agentPoolName: "pci",
  mode: "User",
  vmSize: "Standard_D4s_v5",
  osType: "Linux",
  osSKU: "AzureLinux",
  type: "VirtualMachineScaleSets",
  count: 2,
  enableAutoScaling: true,
  minCount: 2,
  maxCount: 4,
  vnetSubnetID: aksWorkloadSubnet.id,
  orchestratorVersion: "1.30",
  nodeLabels: {
    role: "payment-pci",
  },
  nodeTaints: ["pci-dss=true:NoSchedule"],
} as any);

const clusterCredentials = containerservice.listManagedClusterUserCredentialsOutput({
  resourceGroupName: resourceGroup.name,
  resourceName: aksCluster.name,
});

export const kubeconfig = clusterCredentials.kubeconfigs.apply((configs) =>
  Buffer.from(configs[0].value, "base64").toString(),
);
