/// Corrected rider cost from the original `Evaluator`.
///
/// The original summed `waitTime + rideTime - directLength` per rider and
/// squared it, but it double-counted the first ride segment because the
/// pickup check read a stale copy of the rider state. Under fixed travel
/// times the intended quantity is simply the delay against a direct trip:
/// `dropoff - release - direct`. Squaring it per rider matches the
/// benchmark's passenger pain.
public enum Evaluator {
    public enum Failure: Error, Equatable {
        case unknownRequest(String)
        case negativeDelay(String)
        case missingDropoff(String)
    }

    /// Squared delay in ms² for one rider; exact integer arithmetic so ties are exact.
    public static func pain(dropoffTimeMs: Int, request: ObservedRequest) throws -> Int {
        let delay = dropoffTimeMs - request.requestTimeMs - request.directTravelTimeMs
        if delay < 0 {
            throw Failure.negativeDelay(request.id)
        }
        return delay * delay
    }

    /// Total squared delay of every rider dropped off along a stop list.
    public static func planCost(stops: [TimedStop], requests: [String: ObservedRequest]) throws -> Int {
        var total = 0
        for stop in stops where stop.kind == .dropoff {
            guard let request = requests[stop.requestId] else {
                throw Failure.unknownRequest(stop.requestId)
            }
            total += try pain(dropoffTimeMs: stop.plannedArrivalTimeMs, request: request)
        }
        return total
    }
}
