import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as network from "@pulumi/azure-native/network";
import { hubStackReference, naming, retailNetwork, tags } from "./config";

export const resourceGroup = new resources.ResourceGroup(naming.resourceGroup, {
  resourceGroupName: naming.resourceGroup,
  tags,
});

const aksNsg = new network.NetworkSecurityGroup("nsg-aks-subnets", {
  networkSecurityGroupName: `nsg-acme-retail-aks`,
  resourceGroupName: resourceGroup.name,
  securityRules: [
    {
      name: "AllowHttpsOutbound",
      access: "Allow",
      direction: "Outbound",
      protocol: "Tcp",
      priority: 100,
      sourceAddressPrefix: "*",
      sourcePortRange: "*",
      destinationAddressPrefix: "*",
      destinationPortRange: "443",
    },
    {
      name: "DenyInternetInbound",
      access: "Deny",
      direction: "Inbound",
      protocol: "*",
      priority: 200,
      sourceAddressPrefix: "Internet",
      sourcePortRange: "*",
      destinationAddressPrefix: "*",
      destinationPortRange: "*",
    },
  ],
  tags,
});

const dbNsg = new network.NetworkSecurityGroup("nsg-databases", {
  networkSecurityGroupName: `nsg-acme-retail-databases`,
  resourceGroupName: resourceGroup.name,
  securityRules: [
    {
      name: "AllowVnetInbound",
      access: "Allow",
      direction: "Inbound",
      protocol: "*",
      priority: 100,
      sourceAddressPrefix: "VirtualNetwork",
      sourcePortRange: "*",
      destinationAddressPrefix: "*",
      destinationPortRange: "*",
    },
    {
      name: "DenyInternetInbound",
      access: "Deny",
      direction: "Inbound",
      protocol: "*",
      priority: 200,
      sourceAddressPrefix: "Internet",
      sourcePortRange: "*",
      destinationAddressPrefix: "*",
      destinationPortRange: "*",
    },
  ],
  tags,
});

const peNsg = new network.NetworkSecurityGroup("nsg-private-endpoints", {
  networkSecurityGroupName: `nsg-acme-retail-private-endpoints`,
  resourceGroupName: resourceGroup.name,
  securityRules: [
    {
      name: "AllowVnetInbound",
      access: "Allow",
      direction: "Inbound",
      protocol: "*",
      priority: 100,
      sourceAddressPrefix: "VirtualNetwork",
      sourcePortRange: "*",
      destinationAddressPrefix: "*",
      destinationPortRange: "*",
    },
    {
      name: "DenyInternetInbound",
      access: "Deny",
      direction: "Inbound",
      protocol: "*",
      priority: 200,
      sourceAddressPrefix: "Internet",
      sourcePortRange: "*",
      destinationAddressPrefix: "*",
      destinationPortRange: "*",
    },
  ],
  tags,
});

export const spokeVnet = new network.VirtualNetwork(naming.vnet, {
  virtualNetworkName: naming.vnet,
  resourceGroupName: resourceGroup.name,
  addressSpace: {
    addressPrefixes: [retailNetwork.cidr],
  },
  tags,
});

export const aksSystemSubnet = new network.Subnet(retailNetwork.subnets.aksSystem.name, {
  subnetName: retailNetwork.subnets.aksSystem.name,
  virtualNetworkName: spokeVnet.name,
  resourceGroupName: resourceGroup.name,
  addressPrefix: retailNetwork.subnets.aksSystem.cidr,
  networkSecurityGroup: { id: aksNsg.id },
});

export const aksWorkloadSubnet = new network.Subnet(retailNetwork.subnets.aksWorkload.name, {
  subnetName: retailNetwork.subnets.aksWorkload.name,
  virtualNetworkName: spokeVnet.name,
  resourceGroupName: resourceGroup.name,
  addressPrefix: retailNetwork.subnets.aksWorkload.cidr,
  networkSecurityGroup: { id: aksNsg.id },
});

export const aksGpuSubnet = new network.Subnet(retailNetwork.subnets.aksGpu.name, {
  subnetName: retailNetwork.subnets.aksGpu.name,
  virtualNetworkName: spokeVnet.name,
  resourceGroupName: resourceGroup.name,
  addressPrefix: retailNetwork.subnets.aksGpu.cidr,
  networkSecurityGroup: { id: aksNsg.id },
});

export const databasesSubnet = new network.Subnet(retailNetwork.subnets.databases.name, {
  subnetName: retailNetwork.subnets.databases.name,
  virtualNetworkName: spokeVnet.name,
  resourceGroupName: resourceGroup.name,
  addressPrefix: retailNetwork.subnets.databases.cidr,
  networkSecurityGroup: { id: dbNsg.id },
});

export const privateEndpointsSubnet = new network.Subnet(retailNetwork.subnets.privateEndpoints.name, {
  subnetName: retailNetwork.subnets.privateEndpoints.name,
  virtualNetworkName: spokeVnet.name,
  resourceGroupName: resourceGroup.name,
  addressPrefix: retailNetwork.subnets.privateEndpoints.cidr,
  networkSecurityGroup: { id: peNsg.id },
  privateEndpointNetworkPolicies: "Disabled",
});

const hub = new pulumi.StackReference(hubStackReference);
export const hubOutputs = {
  hubVnetId: hub.getOutput("hubVnetId"),
  hubVnetName: hub.getOutput("hubVnetName"),
  hubResourceGroupName: hub.getOutput("hubResourceGroupName"),
  logAnalyticsWorkspaceId: hub.getOutput("logAnalyticsWorkspaceId"),
  keyVaultUri: hub.getOutput("keyVaultUri"),
  firewallPrivateIp: hub.getOutput("firewallPrivateIp"),
  acrId: hub.getOutput("acrId"),
};

export const spokeToHubPeering = new network.VirtualNetworkPeering("peer-retail-to-hub", {
  virtualNetworkPeeringName: "peer-retail-to-hub",
  resourceGroupName: resourceGroup.name,
  virtualNetworkName: spokeVnet.name,
  remoteVirtualNetwork: {
    id: hubOutputs.hubVnetId,
  },
  allowVirtualNetworkAccess: true,
  allowForwardedTraffic: true,
  allowGatewayTransit: false,
  useRemoteGateways: false,
});

export const hubToSpokePeering = new network.VirtualNetworkPeering("peer-hub-to-retail", {
  virtualNetworkPeeringName: "peer-hub-to-retail",
  resourceGroupName: pulumi.output(hubOutputs.hubResourceGroupName).apply(String),
  virtualNetworkName: pulumi.output(hubOutputs.hubVnetName).apply(String),
  remoteVirtualNetwork: {
    id: spokeVnet.id,
  },
  allowVirtualNetworkAccess: true,
  allowForwardedTraffic: true,
  allowGatewayTransit: false,
  useRemoteGateways: false,
});
