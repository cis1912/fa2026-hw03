import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { projectName, containerPort, desiredCount, region } from "./config";
import { subnetIds } from "./network";
import { serviceSecurityGroup } from "./security";
import { taskExecutionRole } from "./iam";
import { targetGroup, listener } from "./alb";
import { imageUri } from "./image";

// GIVEN: somewhere for your container's logs to land. Without this, debugging a
// task that won't start is nearly impossible.
export const logGroup = new aws.cloudwatch.LogGroup("backend", {
  name: `/ecs/${projectName}`,
  retentionInDays: 7,
});

export const cluster = new aws.ecs.Cluster("this", {
  // TODO: name the cluster. (With Fargate a "cluster" is just a namespace --
  //       there are no servers to join it. You're naming a grouping.)
});

// https://www.pulumi.com/registry/packages/aws/api-docs/ecs/taskdefinition/
export const taskDefinition = new aws.ecs.TaskDefinition("backend", {
  family: projectName,

  // TODO: declare that this task runs on Fargate. That constrains several
  //       things at once: which launch types the task is compatible with,
  //       which networking mode it uses, and the fact that CPU and memory are
  //       requested on the *task* rather than per container ("256" CPU units
  //       and "512" MiB is plenty). It also needs the execution role from
  //       iam.ts.
  //
  // TODO: describe the one container to run. This property is a JSON *string*,
  //       and the field names inside it are AWS's, not Pulumi's:
  //       https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html
  //
  //       The fields need to cover: which image to run (`imageUri` from
  //       image.ts, already digest-pinned), which port the app listens on, the
  //       PLATFORM environment variable the app reports back, and where logs
  //       go (the driver that ships to CloudWatch, pointed at the group above,
  //       in `region`).
  //
  //       One Pulumi wrinkle: some of those values are Outputs with no value
  //       yet, so ordinary JSON.stringify won't do. Pulumi ships a function
  //       that behaves like JSON.stringify but understands Outputs -- find it
  //       on the `pulumi` namespace.
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

    // TODO: in awsvpc mode the service has to be told how to place its tasks
    //       on the network: which subnets, which security group, and whether a
    //       task gets a public IP. It needs one here! network.ts explains why,
    //       and exports the subnet list to use (and why it isn't all of them).
    //
    // TODO: register this service with the target group from alb.ts, so the
    //       load balancer learns where to send traffic. You'll have to name
    //       which container and port it should be delivered to.
  },
  {
    // TODO: one ordering Pulumi can't infer from the references above: the
    //       service can't register targets before the listener exists, and
    //       nothing here references the listener. Resource options have a
    //       field for declaring dependencies.
  },
);
