import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path";
import {
  projectName,
  lambdaRuntime,
  lambdaMemory,
  lambdaTimeout,
} from "./config";
import { lambdaRole } from "./iam";

// GIVEN: where the function's source lives. In Part 1, shipping your code meant
// building a container image and pushing it to a registry. Here the entire
// artifact is a zip of one .mjs file, which Pulumi builds and uploads for you.
const backendDir = path.join(__dirname, "..", "backend");

export const logGroup = new aws.cloudwatch.LogGroup("lambda", {
  // TODO: Lambda writes to a log group whose name follows a fixed convention
  //       based on the function name -- look it up rather than guessing. Give
  //       it a short retention, so Pulumi owns it and `destroy` cleans it up.
  //
  //       Get the name wrong (or leave this empty) and nothing fails: this
  //       resource has no required arguments, so you'll create an
  //       arbitrarily-named group, Lambda will create the real one itself on
  //       first invocation with retention "never expire", every check in this
  //       homework will still pass, and `destroy` will tidy away the decoy and
  //       leave the real one behind forever. The Cleanup section shows how to
  //       check which one you got.
});

// https://www.pulumi.com/registry/packages/aws/api-docs/lambda/function/
export const func = new aws.lambda.Function(
  "backend",
  {
    name: projectName,
    role: lambdaRole.arn,

    // TODO: hand Lambda the code to run. The `code` property takes an archive,
    //       and Pulumi has an asset type that wraps a whole directory -- what
    //       you want for `backendDir` above. Pulumi hashes the archive's
    //       contents itself, so unlike Terraform you don't wire up a separate
    //       source hash; editing index.mjs is enough to redeploy.
    //       https://www.pulumi.com/docs/concepts/assets-archives/
    //
    // TODO: tell AWS how to run it: which managed runtime (`lambdaRuntime`),
    //       and which function inside the package to call per request. That
    //       last one is a string naming both the module and the exported
    //       function -- look at part-2/backend/index.mjs, and remember the zip
    //       is built from inside backendDir.
    //
    // TODO: the memory and time limits, from the config values provided.
    //
    // TODO: the PLATFORM environment variable, as you set it in Part 1, so a
    //       response identifies which of your two deployments answered.
  },
  {
    // TODO: the log group should exist before the function does. Resource
    //       options have a field for declaring dependencies Pulumi can't
    //       infer.
  },
);
