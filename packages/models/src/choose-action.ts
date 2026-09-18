import { type Action } from "@bus20/contracts/action";
import { type Observation } from "@bus20/contracts/observation";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";

/** The only action form model adapters emit in the common candidate-choice track. */
export const chooseCandidateAction = (observation: Observation, candidateId: string): Action => ({
  kind: "chooseCandidate",
  schemaVersion: ACTION_SCHEMA_VERSION,
  stateVersion: observation.stateVersion,
  candidateId,
});
