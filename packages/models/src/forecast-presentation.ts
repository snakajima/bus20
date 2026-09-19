import { type JsonValue } from "@bus20/contracts/json-value";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { type ChoiceOption } from "./choice-client.js";
import { CUMULATIVE_CANDIDATE_INSTRUCTIONS } from "./jev-native.js";
import { CUMULATIVE_PRESENTATION, type Presentation } from "./presentation.js";

/**
 * Shared prompt version 5: version 4 plus a demand forecast. The host, which
 * may know the demand distribution, states how many requests to expect
 * soon and, for every option, when the vehicle would be free and how many
 * requests are expected near where it ends up. The model still chooses;
 * the forecast is information, not a recommendation.
 */
export const FORECAST_PROMPT_VERSION = "bus20-prompt/5" as const;

export const FORECAST_CANDIDATE_INSTRUCTIONS = {
  task: CUMULATIVE_CANDIDATE_INSTRUCTIONS.task,
  how_to_read_options:
    `${CUMULATIVE_CANDIDATE_INSTRUCTIONS.how_to_read_options} Every option also says in how many ` +
    "minutes the vehicle would finish its plan and how many new requests are expected to appear " +
    "near where it ends up in the ten minutes after that. A vehicle that ends up where demand is " +
    "expected can serve those passengers with little wait; one that ends up far from demand cannot.",
  note: CUMULATIVE_CANDIDATE_INSTRUCTIONS.note,
} as const;

/** Forecast for one option: when the vehicle is free and expected demand near its end point. */
export interface OptionForecast {
  readonly vehicleFreeInMinutes: number;
  readonly expectedNearbyRequests: number;
}

/** Host-side forecaster; the runner builds one from the scenario's demand distribution. */
export interface Forecaster {
  /** Expected new requests in the next ten minutes. */
  expectedRequests(observation: Observation): number;
  optionForecast(observation: Observation, candidate: Candidate): OptionForecast;
}

const rounded = (value: number): number => Math.round(value * 10) / 10;

const forecastInWords = (forecast: OptionForecast): string =>
  `free in ${forecast.vehicleFreeInMinutes} minutes with about ${rounded(forecast.expectedNearbyRequests)} new requests expected nearby`;

const withForecast = (option: ChoiceOption, forecast: OptionForecast): ChoiceOption => {
  const base = option.description["what"];
  const what = typeof base === "string" ? base.replace(/\.$/, "") : "";
  return {
    id: option.id,
    description: {
      ...option.description,
      what: `${what}; ${forecastInWords(forecast)}.`,
      vehicle_free_in_minutes: forecast.vehicleFreeInMinutes,
      expected_nearby_requests_after: rounded(forecast.expectedNearbyRequests),
    },
  };
};

/** Version 5 on top of version 4, with forecasts supplied by the host. */
export const createForecastPresentation = (forecaster: Forecaster): Presentation => ({
  id: "forecast",
  promptVersion: FORECAST_PROMPT_VERSION,
  encodingText: `${FORECAST_CANDIDATE_INSTRUCTIONS.how_to_read_options} ${FORECAST_CANDIDATE_INSTRUCTIONS.task}`,
  state: (observation): Record<string, JsonValue> => ({
    ...CUMULATIVE_PRESENTATION.state(observation),
    promptVersion: FORECAST_PROMPT_VERSION,
    expected_new_requests_next_10_minutes: rounded(forecaster.expectedRequests(observation)),
  }),
  candidateQuestion: { ...FORECAST_CANDIDATE_INSTRUCTIONS },
  vehicleQuestion: CUMULATIVE_PRESENTATION.vehicleQuestion,
  candidateOption: (observation, candidate) =>
    withForecast(
      CUMULATIVE_PRESENTATION.candidateOption(observation, candidate),
      forecaster.optionForecast(observation, candidate),
    ),
  vehicleOption: CUMULATIVE_PRESENTATION.vehicleOption,
});
