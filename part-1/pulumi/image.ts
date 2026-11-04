// The image this part deploys.
//
// Pulumi is doing the `docker build` and `docker push` for you! That's what
// awsx.ecr.Image below is. You just have to tell it where to push to.

import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as path from "path";
import { projectName, imageTag } from "./config";

const backendDir = path.join(__dirname, "..", "backend");

// TODO: a repository to hold this project's image.
//
// Two settings beyond the name matter here:
//
//   - `pulumi destroy` has to be able to delete a repository that still
//     contains images. Without that, destroy fails partway through and you get
//     to clean up by hand. Find the property that allows it.
//
//   - Every build here pushes the *same* tag (`imageTag`, "v1"), so the
//     repository must allow an existing tag to be overwritten as mutable tags.
//     Immutable tags are the better default in production, but they only work
//     when every build gets its own tag (a commit SHA, say); combined with a
//     fixed tag, the second push simply fails.
//
// https://www.pulumi.com/registry/packages/aws/api-docs/ecr/repository/
export const repository = new aws.ecr.Repository("backend", {
  // TODO
});

// GIVEN: builds the backend source in part-1/backend and pushes it to the
// repository above.
//
// `image.imageUri` comes back pinned to the pushed image's digest, not its tag.
// That matters: a tag-based reference wouldn't change when you rebuild the same
// tag, so nothing downstream would redeploy and your new code would never ship.
export const image = new awsx.ecr.Image("backend", {
  repositoryUrl: repository.repositoryUrl,
  context: backendDir,
  dockerfile: path.join(backendDir, "Dockerfile"),

  // Pinned so everyone ends up with the same artifact whether their laptop is
  // Apple Silicon or Intel.
  platform: "linux/amd64",
  imageTag,
});
