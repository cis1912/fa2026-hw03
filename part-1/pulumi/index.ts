// GIVEN: the stack's outputs. Nothing to fill in, but you'll use `baseUrl`
// constantly:
//
//   curl "$(pulumi stack output baseUrl)/health"

import * as pulumi from "@pulumi/pulumi";
import { alb } from "./alb";
import { repository } from "./image";
import { cluster, service } from "./ecs";

export const baseUrl = pulumi.interpolate`http://${alb.dnsName}`;
export const ecrRepositoryUrl = repository.repositoryUrl;
export const clusterName = cluster.name;
export const serviceName = service.name;
