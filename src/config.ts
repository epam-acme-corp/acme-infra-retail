import * as pulumi from "@pulumi/pulumi";

export type NamespaceSpec = {
  name: string;
  description: string;
  runtime: string;
  dataTier: string;
  compliance?: "pci-dss";
  affinity?: "gpu";
};

const config = new pulumi.Config();
const azureConfig = new pulumi.Config("azure-native");

export const location = azureConfig.get("location") ?? "eastus";
export const environment = config.get("environment") ?? "prod";
export const hubStackReference = config.get("hubStackReference") ?? "acme-corp/hub/prod";

export const naming = {
  resourceGroup: `rg-acme-retail-${environment}`,
  vnet: `vnet-acme-retail-${environment}`,
  aks: `aks-acme-retail-${environment}`,
};

export const tags = {
  environment,
  managedBy: "pulumi",
  organization: "acme-corp",
  scope: "retail-spoke",
};

export const retailNetwork = {
  cidr: "10.2.0.0/16",
  subnets: {
    aksSystem: { name: "snet-aks-system", cidr: "10.2.0.0/22" },
    aksWorkload: { name: "snet-aks-workload", cidr: "10.2.4.0/22" },
    aksGpu: { name: "snet-aks-gpu", cidr: "10.2.8.0/22" },
    databases: { name: "snet-databases", cidr: "10.2.16.0/24" },
    privateEndpoints: { name: "snet-private-endpoints", cidr: "10.2.17.0/24" },
  },
};

export const namespaceSpecs: NamespaceSpec[] = [
  {
    name: "ecommerce",
    description: "eCommerce Platform / BookStore",
    runtime: ".NET 8 + React 18",
    dataTier: "SQL Server 2019 (on-prem/IaaS)",
  },
  {
    name: "product-catalogue",
    description: "Product Catalogue",
    runtime: ".NET 6",
    dataTier: "Elasticsearch 8 (self-hosted in AKS) + Azure Blob",
  },
  {
    name: "payment",
    description: "Payment Module",
    runtime: ".NET Framework 4.8 to .NET 8 modernization",
    dataTier: "SQL Server 2019 (on-prem/IaaS)",
    compliance: "pci-dss",
  },
  {
    name: "inventory",
    description: "Inventory Management",
    runtime: ".NET 6",
    dataTier: "PostgreSQL 15 + RabbitMQ",
  },
  {
    name: "order-fulfillment",
    description: "Order Fulfillment",
    runtime: ".NET 6",
    dataTier: "PostgreSQL 15",
  },
  {
    name: "loyalty",
    description: "Loyalty Platform",
    runtime: "Node.js 20 / Express",
    dataTier: "MongoDB 7 (Cosmos DB API)",
  },
  {
    name: "recommendation",
    description: "Recommendation Engine",
    runtime: "Python 3.11 / FastAPI",
    dataTier: "TensorFlow Serving + Redis 7",
    affinity: "gpu",
  },
];

export const managedDatabaseNames = {
  inventoryPostgres: "psql-acme-retail-inventory-prod",
  orderPostgres: "psql-acme-retail-order-prod",
  loyaltyCosmos: "cosmos-acme-retail-loyalty-prod",
  recommendationRedis: "redis-acme-retail-reco-prod",
};
