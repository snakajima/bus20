import Foundation

/// Mirrors `bus20-observation/1` from `@bus20/contracts`. Only fields the
/// reference needs are modelled; unknown fields are ignored on decode.
public struct Observation: Codable, Equatable {
    public let schemaVersion: String
    public let scenarioId: String
    public let stateVersion: Int
    public let nowMs: Int
    public let decisionRequestId: String
    public let vehicles: [ObservedVehicle]
    public let requests: [ObservedRequest]
    public let candidates: [Candidate]

    public init(schemaVersion: String, scenarioId: String, stateVersion: Int, nowMs: Int,
                decisionRequestId: String, vehicles: [ObservedVehicle],
                requests: [ObservedRequest], candidates: [Candidate]) {
        self.schemaVersion = schemaVersion
        self.scenarioId = scenarioId
        self.stateVersion = stateVersion
        self.nowMs = nowMs
        self.decisionRequestId = decisionRequestId
        self.vehicles = vehicles
        self.requests = requests
        self.candidates = candidates
    }
}

public enum StopKind: String, Codable, Equatable {
    case pickup
    case dropoff
}

/// A planned stop with the host-computed arrival time along the route.
public struct TimedStop: Codable, Equatable {
    public let requestId: String
    public let kind: StopKind
    public let nodeId: String
    public let plannedArrivalTimeMs: Int

    public init(requestId: String, kind: StopKind, nodeId: String, plannedArrivalTimeMs: Int) {
        self.requestId = requestId
        self.kind = kind
        self.nodeId = nodeId
        self.plannedArrivalTimeMs = plannedArrivalTimeMs
    }
}

public struct ObservedVehicle: Codable, Equatable {
    public let id: String
    public let capacity: Int
    public let onboardRequestIds: [String]
    /// Remaining committed stops with planned arrival times.
    public let stops: [TimedStop]

    public init(id: String, capacity: Int, onboardRequestIds: [String], stops: [TimedStop]) {
        self.id = id
        self.capacity = capacity
        self.onboardRequestIds = onboardRequestIds
        self.stops = stops
    }
}

public struct ObservedRequest: Codable, Equatable {
    public let id: String
    public let requestTimeMs: Int
    public let originNodeId: String
    public let destinationNodeId: String
    public let phase: String
    public let directTravelTimeMs: Int

    public init(id: String, requestTimeMs: Int, originNodeId: String, destinationNodeId: String,
                phase: String, directTravelTimeMs: Int) {
        self.id = id
        self.requestTimeMs = requestTimeMs
        self.originNodeId = originNodeId
        self.destinationNodeId = destinationNodeId
        self.phase = phase
        self.directTravelTimeMs = directTravelTimeMs
    }
}

public struct Candidate: Codable, Equatable {
    public let id: String
    public let vehicleId: String
    public let stops: [TimedStop]

    public init(id: String, vehicleId: String, stops: [TimedStop]) {
        self.id = id
        self.vehicleId = vehicleId
        self.stops = stops
    }
}

/// Mirrors the `chooseCandidate` form of `bus20-action/1`.
public struct ChooseCandidateAction: Codable, Equatable {
    public let kind = "chooseCandidate"
    public let schemaVersion = "bus20-action/1"
    public let stateVersion: Int
    public let candidateId: String

    enum CodingKeys: String, CodingKey {
        case kind, schemaVersion, stateVersion, candidateId
    }

    public init(stateVersion: Int, candidateId: String) {
        self.stateVersion = stateVersion
        self.candidateId = candidateId
    }
}
