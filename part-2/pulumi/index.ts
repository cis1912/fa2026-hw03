// GIVEN: the stack's outputs. Nothing to fill in, but `baseUrl` is the one
// you'll use constantly:
//
//   curl "$(pulumi stack output baseUrl)/health"

import { api, stage } from "./apigateway";
import { func } from "./lambda";

// apiEndpoint already points at the $default stage, so there's no path prefix
// to tack on, unlike a named stage, which you'd have to append.
export const baseUrl = api.apiEndpoint;
export const functionName = func.name;
export const stageName = stage.name;
