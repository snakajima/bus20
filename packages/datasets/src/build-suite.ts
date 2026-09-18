import { digestDocument } from "@bus20/contracts/digest";
import {
  type DataSplit,
  type DemandPattern,
  type LoadLevel,
  type Manifest,
  type ManifestMap,
  type ManifestScenario,
} from "@bus20/contracts/manifest";
import { type MapDocument } from "@bus20/contracts/map";
import { type ScenarioDocument } from "@bus20/contracts/scenario";
import { MANIFEST_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type DemandSpec, GENERATOR_NAME, GENERATOR_VERSION, generateScenario } from "./demand.js";
import { seedFromLabel } from "@bus20/contracts/random";
import { type SuiteConfig } from "./suite-config.js";
import { generateSyntheticMap, type SyntheticMapSpec } from "./synthetic-map.js";

export const MAP_VERSION = "v1" as const;

export interface BuiltMap {
  readonly entry: ManifestMap;
  readonly document: MapDocument;
}

export interface BuiltScenario {
  readonly entry: ManifestScenario;
  readonly document: ScenarioDocument;
}

export interface BuiltSuite {
  readonly manifest: Manifest;
  readonly maps: readonly BuiltMap[];
  readonly scenarios: readonly BuiltScenario[];
}

export const mapPath = (city: string): string => `maps/${city}/${MAP_VERSION}/map.json`;
export const scenarioPath = (split: DataSplit, id: string): string =>
  `scenarios/${split}/${id}.json`;

type CityConfig = SuiteConfig["cities"][number];

const mapSpec = (config: SuiteConfig, city: CityConfig): SyntheticMapSpec => ({
  id: `${city.id}-${MAP_VERSION}`,
  city: city.name,
  width: city.width,
  height: city.height,
  blockMeters: city.blockMeters,
  removeFraction: city.removeFraction,
  oneWayFraction: city.oneWayFraction,
  speedsMps: city.speedsMps,
  originLat: city.originLat,
  originLon: city.originLon,
  seed: seedFromLabel(config.seed, `map:${city.id}`),
});

const buildMap = (config: SuiteConfig, city: CityConfig): BuiltMap => {
  const document = generateSyntheticMap(mapSpec(config, city));
  return {
    document,
    entry: {
      id: document.id,
      version: MAP_VERSION,
      path: mapPath(city.id),
      digest: digestDocument(document),
      kind: "synthetic",
      city: city.id,
    },
  };
};

interface Cell {
  readonly city: string;
  readonly load: LoadLevel;
  readonly split: DataSplit;
  readonly index: number;
  readonly pattern: DemandPattern;
}

const cells = (config: SuiteConfig): Cell[] => {
  const loads = Object.keys(config.loads).filter((key): key is LoadLevel => key in config.loads);
  const splits = Object.entries(config.splits).filter(
    (entry): entry is [DataSplit, number] => entry[1] > 0,
  );
  const patternAt = (index: number): DemandPattern | undefined =>
    config.patterns[index % config.patterns.length];
  return config.cities.flatMap((city) =>
    loads.flatMap((load) =>
      splits.flatMap(([split, count]) =>
        Array.from({ length: count }, (_, index) => ({ index, pattern: patternAt(index) })).flatMap(
          ({ index, pattern }) =>
            pattern === undefined ? [] : [{ city: city.id, load, split, index, pattern }],
        ),
      ),
    ),
  );
};

const demandSpec = (config: SuiteConfig, cell: Cell, scenarioId: string): DemandSpec => ({
  scenarioId,
  city: cell.city,
  load: cell.load,
  pattern: cell.pattern,
  split: cell.split,
  seed: seedFromLabel(config.seed, `scenario:${scenarioId}`),
  vehicleCount: config.fleet.vehicleCount,
  capacity: config.fleet.capacity,
  demandMinutes: config.timing.demandMinutes,
  deadlineMarginMinutes: config.timing.deadlineMarginMinutes,
  targetUtilization: config.loads[cell.load]?.targetUtilization ?? 0,
  ...(config.hotspot === undefined ? {} : { hotspot: config.hotspot }),
});

const buildScenario = (config: SuiteConfig, map: BuiltMap, cell: Cell): BuiltScenario => {
  const scenarioId = `${cell.city}-${cell.load}-${cell.split}-${String(cell.index + 1).padStart(2, "0")}`;
  const document = generateScenario(map.document, demandSpec(config, cell, scenarioId));
  return {
    document,
    entry: {
      id: scenarioId,
      path: scenarioPath(cell.split, scenarioId),
      digest: digestDocument(document),
      mapId: map.entry.id,
      city: cell.city,
      load: cell.load,
      pattern: cell.pattern,
      split: cell.split,
      seed: Number(document.provenance?.["seed"] ?? 0),
      requestCount: document.requests.length,
      vehicleCount: document.vehicles.length,
    },
  };
};

/** Pure: config in, complete suite out. No I/O, no clock except `createdAt`. */
export const buildSuite = (config: SuiteConfig, createdAt: string): BuiltSuite => {
  const maps = config.cities.map((city) => buildMap(config, city));
  const byCity = new Map(maps.map((map) => [map.entry.city, map]));
  const scenarios = cells(config).flatMap((cell) => {
    const map = byCity.get(cell.city);
    return map === undefined ? [] : [buildScenario(config, map, cell)];
  });
  const manifest: Manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    benchmarkVersion: config.benchmarkVersion,
    createdAt,
    generator: { name: GENERATOR_NAME, version: GENERATOR_VERSION, seed: config.seed },
    maps: maps.map((map) => map.entry),
    scenarios: scenarios.map((scenario) => scenario.entry),
  };
  return { manifest, maps, scenarios };
};
