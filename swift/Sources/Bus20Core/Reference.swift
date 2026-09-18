/// The Swift insertion reference, headless.
///
/// The original `Shuttle.plans` enumerated every insertion of a rider's pickup
/// and drop-off into a shuttle's route sections and `Shuttle.bestPlan` chose
/// the smallest incremental cost across shuttles. The common environment now
/// enumerates the same insertions as candidates with planned arrival times, so
/// the reference only has to score them: incremental cost of a candidate is
/// the plan cost with the new rider minus the vehicle's current plan cost.
/// Ties resolve to the first candidate in host order, which is
/// (vehicle ID, pickup index, drop-off index) and carries no cost information.
public enum Reference {
    public static let version = "bus20-swift-reference/1"

    public struct Choice: Equatable {
        public let candidateId: String
        public let incrementalCostMs2: Int
        public let candidatesEvaluated: Int
    }

    public enum Failure: Error, Equatable {
        case noCandidates
        case unknownVehicle(String)
        case missingDecisionRequest(String)
    }

    static func requestIndex(_ observation: Observation) -> [String: ObservedRequest] {
        var index = [String: ObservedRequest]()
        for request in observation.requests {
            index[request.id] = request
        }
        return index
    }

    static func currentCosts(_ observation: Observation, requests: [String: ObservedRequest]) throws -> [String: Int] {
        var costs = [String: Int]()
        for vehicle in observation.vehicles {
            costs[vehicle.id] = try Evaluator.planCost(stops: vehicle.stops, requests: requests)
        }
        return costs
    }

    public static func choose(_ observation: Observation) throws -> Choice {
        let requests = requestIndex(observation)
        guard requests[observation.decisionRequestId] != nil else {
            throw Failure.missingDecisionRequest(observation.decisionRequestId)
        }
        let basis = try currentCosts(observation, requests: requests)
        var best: Choice? = nil
        for candidate in observation.candidates {
            guard let vehicleBasis = basis[candidate.vehicleId] else {
                throw Failure.unknownVehicle(candidate.vehicleId)
            }
            let cost = try Evaluator.planCost(stops: candidate.stops, requests: requests) - vehicleBasis
            if best == nil || cost < best!.incrementalCostMs2 {
                best = Choice(candidateId: candidate.id, incrementalCostMs2: cost,
                              candidatesEvaluated: observation.candidates.count)
            }
        }
        guard let choice = best else {
            throw Failure.noCandidates
        }
        return choice
    }

    public static func action(for observation: Observation) throws -> ChooseCandidateAction {
        let choice = try choose(observation)
        return ChooseCandidateAction(stateVersion: observation.stateVersion, candidateId: choice.candidateId)
    }
}
