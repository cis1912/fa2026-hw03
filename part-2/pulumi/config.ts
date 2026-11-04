// GIVEN: configuration, with the defaults declared in Pulumi.yaml. Note how
// much shorter this is than Part 1's: no container port, no image tag, no
// replica count. There's no container and no server, so there's nothing to say
// about either.

import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const projectName = config.require("projectName");
export const lambdaRuntime = config.require("lambdaRuntime");
export const lambdaMemory = config.requireNumber("lambdaMemory");
export const lambdaTimeout = config.requireNumber("lambdaTimeout");

export const region = new pulumi.Config("aws").require("region");
