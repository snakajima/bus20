import { digestDocument } from "@bus20/contracts/digest";
import { type JsonValue } from "@bus20/contracts/json-value";
import { createRng, seedFromLabel } from "@bus20/contracts/random";
import {
  type ChoiceClient,
  type ChoiceOption,
  type ChoiceReply,
  type ChoiceRequest,
} from "./choice-client.js";

/** Seeded Fisher-Yates so the permutations are reproducible from the request content. */
const permute = (options: readonly ChoiceOption[], seed: number): ChoiceOption[] => {
  const rng = createRng(seed);
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    const left = shuffled[i];
    const right = shuffled[j];
    if (left !== undefined && right !== undefined) {
      shuffled[i] = right;
      shuffled[j] = left;
    }
  }
  return shuffled;
};

const probabilitiesOf = (reply: ChoiceReply): Readonly<Record<string, number>> => {
  const raw = reply.trace["probabilities"];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { [reply.choice]: 1 };
  }
  return Object.fromEntries(
    Object.entries(raw).flatMap(([id, value]) => (typeof value === "number" ? [[id, value]] : [])),
  );
};

const sumUsage = (replies: readonly ChoiceReply[]): Record<string, number> => {
  const total: Record<string, number> = {};
  for (const reply of replies) {
    for (const [key, value] of Object.entries(reply.usage)) {
      total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
};

/** Host-order argmax of the summed probability mass; ties go to the earlier option. */
const summedMass = (replies: readonly ChoiceReply[]): Record<string, number> => {
  const mass: Record<string, number> = {};
  for (const reply of replies) {
    for (const [id, value] of Object.entries(probabilitiesOf(reply))) {
      mass[id] = (mass[id] ?? 0) + value;
    }
  }
  return mass;
};

const aggregate = (request: ChoiceRequest, replies: readonly ChoiceReply[]): ChoiceReply => {
  const mass = summedMass(replies);
  const choice = request.options.reduce<ChoiceOption | undefined>(
    (best, option) =>
      best === undefined || (mass[option.id] ?? 0) > (mass[best.id] ?? 0) ? option : best,
    undefined,
  );
  if (choice === undefined) {
    throw new Error("self-consistency aggregation received no options");
  }
  const summed: Record<string, JsonValue> = { ...mass };
  return {
    choice: choice.id,
    usage: { ...sumUsage(replies), repeats: replies.length },
    trace: { aggregated: summed, votes: replies.map((reply): JsonValue => ({ ...reply.trace })) },
  };
};

/**
 * Asks the same choice `repeats` times, each with a different seeded
 * permutation of the option order, and sums the returned probability
 * distributions in code. Every call's usage is charged.
 */
export const withSelfConsistency = (client: ChoiceClient, repeats: number): ChoiceClient => ({
  ask: async (request) => {
    const base = seedFromLabel(
      0,
      digestDocument({ state: request.state, question: request.question }),
    );
    const replies: ChoiceReply[] = [];
    for (let repeat = 0; repeat < repeats; repeat += 1) {
      const options = repeat === 0 ? request.options : permute(request.options, base + repeat);
      replies.push(await client.ask({ ...request, options }));
    }
    return aggregate(request, replies);
  },
});
