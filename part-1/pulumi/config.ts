// GIVEN: configuration, with the defaults declared in Pulumi.yaml. Nothing to
// change here.

import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const projectName = config.require("projectName");
export const containerPort = config.requireNumber("containerPort");
export const imageTag = config.require("imageTag");
export const desiredCount = config.requireNumber("desiredCount");

export const region = new pulumi.Config("aws").require("region");
