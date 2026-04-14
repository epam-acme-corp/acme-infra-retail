# Acme Retail Spoke Infrastructure (Pulumi TypeScript)

Retail spoke infrastructure for Acme Corp Hub-Spoke architecture on Azure.

## Scope

- VNet `10.2.0.0/16` with AKS, database, and private endpoint subnets
- Bidirectional VNet peering with Hub via stack reference (`acme-corp/hub/prod`)
- AKS `aks-acme-retail-prod` (Kubernetes 1.30, Azure CNI Overlay, Workload Identity, Azure Linux)
- Seven retail namespaces with dedicated user-assigned managed identities
- Managed data services:
  - PostgreSQL Flexible: inventory + order fulfillment
  - Cosmos DB (MongoDB API): loyalty
  - Redis Enterprise: recommendation
- Private endpoints for all managed data services

## Project Layout

```text
src/
  index.ts
  config.ts
  networking.ts
  aks.ts
  namespaces.ts
  databases.ts
  identity.ts
  security.ts
  monitoring.ts
  outputs.ts
```

## Prerequisites

- Node.js 22
- Pulumi CLI
- Azure CLI
- Pulumi access token
- Azure permissions for networking, AKS, managed identities, databases, monitoring, and RBAC assignments

## Install and Type Check

```bash
npm install
npx tsc --noEmit
```

## Deploy

```bash
pulumi stack init prod
pulumi config set azure-native:location eastus
pulumi config set acme-infra-retail:environment prod
pulumi config set acme-infra-retail:hubStackReference acme-corp/hub/prod
pulumi preview
pulumi up
```

## State Management

This repository stores Pulumi state in Azure Blob Storage using:

```yaml
backend:
  url: azblob://pulumi-state
```

Initial backend provisioning is managed in `epam-acme-corp/acme-infra-bootstrap`.

Set this environment variable in local shells and CI:

```bash
export AZURE_STORAGE_ACCOUNT=stacmestateprod
```
