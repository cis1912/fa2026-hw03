import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path";
import { projectName, lambdaRuntime, lambdaMemory, lambdaTimeout } from "./config";
import { lambdaRole, lambdaPolicyAttachment } from "./iam";

// GIVEN: where the function's source lives. In Part 1, shipping your code meant
// building a container image and pushing it to a registry. Here the entire
// artifact is a zip of one .mjs file, which Pulumi builds and uploads for you.
const backendDir = path.join(__dirname, "..", "backend");

export const logGroup = new aws.cloudwatch.LogGroup("lambda", {
    // TODO: Lambda writes to a log group whose name follows a fixed convention
    //       based on the function name -- look it up rather than guessing. Give
    //       it a short retention, so Pulumi owns it and `destroy` cleans it up.
    //
    //       Skip this and Lambda creates the group itself on first invocation,
    //       with retention set to "never expire", and it quietly outlives every
    //       destroy you ever run.
});

// https://www.pulumi.com/registry/packages/aws/api-docs/lambda/function/
export const func = new aws.lambda.Function("backend", {
    name: projectName,
    role: lambdaRole.arn,

    // TODO: hand Lambda the code to run. The `code` property takes an archive
    //       -- Pulumi has an asset type that wraps a whole directory, which is
    //       what you want for `backendDir` above. Pulumi hashes the archive's
    //       contents itself, so unlike Terraform you don't have to wire up a
    //       separate source hash; editing index.mjs is enough to redeploy.
    //       https://www.pulumi.com/docs/concepts/assets-archives/
    //
    // TODO: tell AWS how to run it: which managed runtime (`lambdaRuntime`),
    //       and which function inside the package to call for each request.
    //       That last one is a string naming both the module and the exported
    //       function -- look at part-2/backend/index.mjs, and remember the zip
    //       is built from inside backendDir.
    //
    // TODO: the memory and time limits, from the config values provided.
    //
    // TODO: the PLATFORM environment variable, as you set it in Part 1, so a
    //       response identifies which of your two deployments answered.
}, {
    // TODO: the log group and the role's policy attachment should both exist
    //       before the function does. Resource options have a field for
    //       declaring dependencies Pulumi can't infer.
});
