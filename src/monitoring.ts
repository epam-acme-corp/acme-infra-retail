import * as insights from "@pulumi/azure-native/insights";
import { tags } from "./config";
import { aksCluster } from "./aks";
import {
  inventoryPostgres,
  loyaltyCosmos,
  orderPostgres,
  recommendationRedis,
} from "./databases";
import { hubOutputs, resourceGroup } from "./networking";

const diagnosticTargets = [
  { name: "diag-aks-retail", id: aksCluster.id },
  { name: "diag-psql-inventory", id: inventoryPostgres.id },
  { name: "diag-psql-order", id: orderPostgres.id },
  { name: "diag-cosmos-loyalty", id: loyaltyCosmos.id },
  { name: "diag-redis-reco", id: recommendationRedis.id },
];

export const diagnostics = diagnosticTargets.map(
  (target) =>
    new insights.DiagnosticSetting(target.name, {
      workspaceId: hubOutputs.logAnalyticsWorkspaceId,
      logs: [{ categoryGroup: "allLogs", enabled: true }],
      metrics: [{ category: "AllMetrics", enabled: true }],
      resourceUri: target.id,
      logAnalyticsDestinationType: "Dedicated",
    } as any),
);

export const retailActionGroup = new insights.ActionGroup("ag-retail-platform", {
  actionGroupName: "ag-retail-platform",
  enabled: true,
  resourceGroupName: resourceGroup.name,
  groupShortName: "retailops",
  tags,
});
