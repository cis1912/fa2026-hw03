import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { projectName, containerPort, desiredCount, region } from "./config";
import { subnetIds } from "./network";
import { serviceSecurityGroup } from "./security";
import { taskExecutionRole } from "./iam";
import { targetGroup, listener } from "./alb";
import { image } from "./image";

// GIVEN: somewhere for your container's logs to land. Without this, debugging a
// task that won't start is nearly impossible.
export const logGroup = new aws.cloudwatch.LogGroup("backend", {
  name: `/ecs/${projectName}`,
  retentionInDays: 7,
});

export const cluster = new aws.ecs.Cluster("this", {
  // TODO: name the cluster.
  //       (With Fargate a "cluster" is just a namespace. There are no
  //       servers to join it. You're naming a grouping, nothing more.)
});

// https://www.pulumi.com/registry/packages/aws/api-docs/ecs/taskdefinition/
export const taskDefinition = new aws.ecs.TaskDefinition("backend", {
  family: projectName,

  // TODO: declare that this task runs on Fargate. That constrains several
  //       things at once: which launch types the task is compatible with,
  //       which networking mode it uses, and the fact that CPU and memory are
  //       requested on the *task* rather than per container ("256" CPU units
  //       and "512" MiB is plenty here). It also needs the execution role
  //       from iam.ts.
  //
  // TODO: describe the one container to run. This property is a JSON *string*,
  //       and the field names inside it are AWS's, not Pulumi's:
  //       https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html
  //
  //       Between them, the fields need to cover: which image to run (use
  //       `image.imageUri` from image.ts, already digest-pinned), which
  //       port the app listens on, the PLATFORM environment variable the app
  //       reports back to you, and where the container's logs should go (the
  //       driver that ships to CloudWatch, pointed at the group above, in
  //       `region`).
  //
  //       One Pulumi-specific wrinkle: some of those values are Outputs that
  //       don't have values yet, so ordinary JSON.stringify won't do. Pulumi
  //       ships a function that behaves like JSON.stringify but understands
  //       Outputs. Find it on the `pulumi` namespace.
});

// https://www.pulumi.com/registry/packages/aws/api-docs/ecs/service/
export const service = new aws.ecs.Service(
  "backend",
  {
    name: projectName,
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: desiredCount,
    launchType: "FARGATE",

    // TODO: in awsvpc mode, the service has to be told how to place its tasks on
    //       the network: which subnets, which security group, and whether a
    //       task gets a public IP. It needs one here! network.ts explains
    //       why, and also exports the subnet list to use (and why it isn't all
    //       of them).
    //
    // TODO: register this service with the target group from alb.ts, so the load
    //       balancer learns where to send traffic. You'll have to name which
    //       container and port it should be delivered to.
  },
  {
    // TODO: two orderings Pulumi can't infer from the references above:
    //         - the service can't register targets before the listener exists
    //         - the first task can't pull its image before the execution role's
    //           *policy attachment* lands (referencing the role is not the same
    //           as depending on the attachment, iam.ts exports both)
    //       Resource options have a field for declaring dependencies explicitly.
  },
);
