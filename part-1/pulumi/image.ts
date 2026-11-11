// The image this part deploys. Pulumi does the `docker build` and
// `docker push` for you -- that's the docker-build Image below; you just tell
// it where to push to.

import * as aws from "@pulumi/aws";
import * as dockerBuild from "@pulumi/docker-build";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path";
import { projectName, imageTag } from "./config";

const backendDir = path.join(__dirname, "..", "backend");

// TODO: a repository to hold this project's image. Two settings beyond the name
//       matter:
//
//   - `pulumi destroy` must be able to delete a repository that still contains
//     images, or destroy fails partway and you clean up by hand.
//
//   - Every build pushes the *same* tag (`imageTag`, "v1"), so the repository
//     must allow an existing tag to be overwritten -- mutable tags. Immutable
//     is the better production default, but only works when every build gets
//     its own tag (a commit SHA, say); with a fixed tag the second push fails.
//
// https://www.pulumi.com/registry/packages/aws/api-docs/ecr/repository/
export const repository = new aws.ecr.Repository("backend", {
  // TODO
});

// GIVEN: builds the source in part-1/backend and pushes it to the repository
// above, logging in to ECR with a short-lived token minted for that purpose.
const ecrAuth = aws.ecr.getAuthorizationTokenOutput({
  registryId: repository.registryId,
});

export const image = new dockerBuild.Image("backend", {
  tags: [pulumi.interpolate`${repository.repositoryUrl}:${imageTag}`],
  context: { location: backendDir },
  dockerfile: { location: path.join(backendDir, "Dockerfile") },

  // Pinned so everyone gets the same artifact, Apple Silicon or Intel.
  platforms: ["linux/amd64"],

  push: true,
  registries: [
    {
      address: repository.repositoryUrl,
      username: ecrAuth.userName,
      password: ecrAuth.password,
    },
  ],
});

// GIVEN: the image to run, pinned to the pushed image's *digest*, not its tag.
// A tag-based reference wouldn't change when you rebuild the same tag, so
// nothing downstream would redeploy and your new code would never ship.
export const imageUri = pulumi.interpolate`${repository.repositoryUrl}@${image.digest}`;
