// The image this part deploys. Pulumi does the `docker build` and
// `docker push` for you -- that's awsx.ecr.Image below; you just tell it where
// to push to.

import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
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
// above.
//
// `image.imageUri` comes back pinned to the pushed image's digest, not its tag.
// A tag-based reference wouldn't change when you rebuild the same tag, so
// nothing downstream would redeploy and your new code would never ship.
export const image = new awsx.ecr.Image("backend", {
  repositoryUrl: repository.repositoryUrl,
  context: backendDir,
  dockerfile: path.join(backendDir, "Dockerfile"),

  // Pinned so everyone gets the same artifact, Apple Silicon or Intel.
  platform: "linux/amd64",
  imageTag,
});
