#!/usr/bin/env python3
"""Extract a Bus 2.0 map document (bus20-map/1) from OpenStreetMap with OSMnx.

Preprocessing only. The benchmark runtime never touches the network; it reads
the JSON this script writes. Record the retrieval time, the bounding box, the
OSMnx version and this script's version alongside the map, and keep the ODbL
attribution in the document.

Usage:
    python3 tools/osm/extract_map.py --place "Financial District, San Francisco, California" \
        --id sf-fidi --buffer-meters 300 --out datasets/osm/sf-fidi/v1/map.json

Requires: osmnx >= 2.0, networkx. Not executed in CI; verify locally.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys

SCRIPT_VERSION = "1"
DEFAULT_SPEED_KPH = 30.0
MS_PER_HOUR = 3_600_000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--place", required=True, help="Place name understood by OSMnx geocoding")
    parser.add_argument("--id", required=True, help="Map id, e.g. sf-fidi")
    parser.add_argument("--buffer-meters", type=float, default=300.0, help="Road buffer around the demand area")
    parser.add_argument("--default-speed-kph", type=float, default=DEFAULT_SPEED_KPH)
    parser.add_argument("--out", required=True, help="Output map.json path")
    return parser.parse_args()


def travel_time_ms(length_m: float, speed_kph: float) -> int:
    hours = (length_m / 1000.0) / max(speed_kph, 1.0)
    return max(1, int(round(hours * MS_PER_HOUR)))


def build_document(graph, map_id: str, place: str, buffer_m: float, default_speed: float) -> dict:
    """Convert a strongly connected OSMnx MultiDiGraph into bus20-map/1."""
    nodes = []
    for node_id, data in graph.nodes(data=True):
        nodes.append(
            {
                "id": f"n{node_id}",
                "stopAllowed": bool(data.get("street_count", 0) >= 2),
                "lat": float(data["y"]),
                "lon": float(data["x"]),
            }
        )
    edges = []
    seen = set()
    for u, v, key, data in graph.edges(keys=True, data=True):
        edge_id = f"e{u}-{v}-{key}"
        if edge_id in seen:
            continue
        seen.add(edge_id)
        speed = float(data.get("speed_kph", default_speed) or default_speed)
        length = float(data.get("length", 0.0))
        edges.append(
            {
                "id": edge_id,
                "from": f"n{u}",
                "to": f"n{v}",
                "travelTimeMs": travel_time_ms(length, speed),
                "lengthMeters": round(length, 1),
            }
        )
    return {
        "schemaVersion": "bus20-map/1",
        "id": map_id,
        "nodes": nodes,
        "edges": edges,
        "source": {
            "provider": "OpenStreetMap via OSMnx",
            "attribution": "© OpenStreetMap contributors",
            "license": "ODbL 1.0 (https://www.openstreetmap.org/copyright)",
            "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "notes": (
                f"place={place!r}; buffer={buffer_m} m; drivable network; speeds from OSM maxspeed "
                f"with {default_speed} km/h fallback; largest strongly connected component kept; "
                f"extract_map.py v{SCRIPT_VERSION}"
            ),
        },
    }


def write_atomic(path: str, document: dict) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    temp = f"{path}.{os.getpid()}.tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(document, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    os.replace(temp, path)


def main() -> int:
    args = parse_args()
    try:
        import osmnx as ox  # type: ignore
    except ImportError:
        print("osmnx is required: pip install osmnx", file=sys.stderr)
        return 2
    graph = ox.graph_from_place(args.place, network_type="drive", buffer_dist=args.buffer_meters)
    graph = ox.add_edge_speeds(graph, fallback=args.default_speed_kph)
    graph = ox.truncate.largest_component(graph, strongly=True)
    document = build_document(graph, args.id, args.place, args.buffer_meters, args.default_speed_kph)
    write_atomic(args.out, document)
    print(json.dumps({"out": args.out, "nodes": len(document["nodes"]), "edges": len(document["edges"])}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
