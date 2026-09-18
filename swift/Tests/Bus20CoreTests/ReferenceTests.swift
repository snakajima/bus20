import XCTest
@testable import Bus20Core

final class ReferenceTests: XCTestCase {
    private let minute = 60_000

    private func request(_ id: String, at: Int, direct: Int) -> ObservedRequest {
        ObservedRequest(id: id, requestTimeMs: at, originNodeId: "o", destinationNodeId: "d",
                        phase: "waiting", directTravelTimeMs: direct)
    }

    private func stop(_ id: String, _ kind: StopKind, at: Int) -> TimedStop {
        TimedStop(requestId: id, kind: kind, nodeId: "n", plannedArrivalTimeMs: at)
    }

    func testPainIsSquaredDelayAgainstDirectTrip() throws {
        // Released at 10 min, direct 7 min, dropped at 22 min: wait+detour = 5 min -> 25 min².
        let pain = try Evaluator.pain(dropoffTimeMs: 22 * minute,
                                      request: request("r", at: 10 * minute, direct: 7 * minute))
        XCTAssertEqual(pain, (5 * minute) * (5 * minute))
        XCTAssertThrowsError(try Evaluator.pain(dropoffTimeMs: 0, request: request("r", at: 0, direct: 1)))
    }

    func testChoosesSmallestIncrementalCostAcrossVehicles() throws {
        let existing = request("r1", at: 0, direct: 2 * minute)
        let new = request("r2", at: minute, direct: minute)
        // v1 already carries r1 (dropoff planned at 2 min). Inserting r2 first delays r1 by 2 min.
        let v1 = ObservedVehicle(id: "v1", capacity: 4, onboardRequestIds: ["r1"],
                                 stops: [stop("r1", .dropoff, at: 2 * minute)])
        let v2 = ObservedVehicle(id: "v2", capacity: 4, onboardRequestIds: [], stops: [])
        let candidates = [
            Candidate(id: "v1:0:1", vehicleId: "v1", stops: [
                stop("r2", .pickup, at: 2 * minute), stop("r2", .dropoff, at: 3 * minute),
                stop("r1", .dropoff, at: 4 * minute),
            ]),
            Candidate(id: "v1:1:2", vehicleId: "v1", stops: [
                stop("r1", .dropoff, at: 2 * minute),
                stop("r2", .pickup, at: 3 * minute), stop("r2", .dropoff, at: 4 * minute),
            ]),
            Candidate(id: "v2:0:1", vehicleId: "v2", stops: [
                stop("r2", .pickup, at: 3 * minute), stop("r2", .dropoff, at: 4 * minute),
            ]),
        ]
        let observation = Observation(schemaVersion: "bus20-observation/1", scenarioId: "s", stateVersion: 3,
                                      nowMs: minute, decisionRequestId: "r2", vehicles: [v1, v2],
                                      requests: [existing, new], candidates: candidates)
        let choice = try Reference.choose(observation)
        // v1:0:1: r2 delay 1 min (1) + r1 delay grows 0 -> 2 min (4) = 5 min².
        // v1:1:2: r2 delay 2 min = 4 min². v2:0:1: r2 delay 2 min = 4 min² (tie -> first in order).
        XCTAssertEqual(choice.candidateId, "v1:1:2")
        XCTAssertEqual(choice.incrementalCostMs2, (2 * minute) * (2 * minute))
        XCTAssertEqual(choice.candidatesEvaluated, 3)
        let action = try Reference.action(for: observation)
        XCTAssertEqual(action.stateVersion, 3)
        XCTAssertEqual(action.candidateId, "v1:1:2")
    }

    func testLineHandlerRoundTrip() throws {
        let observation = Observation(schemaVersion: "bus20-observation/1", scenarioId: "s", stateVersion: 0,
                                      nowMs: 0, decisionRequestId: "r1",
                                      vehicles: [ObservedVehicle(id: "v1", capacity: 1, onboardRequestIds: [], stops: [])],
                                      requests: [request("r1", at: 0, direct: minute)],
                                      candidates: [Candidate(id: "v1:0:1", vehicleId: "v1", stops: [
                                          stop("r1", .pickup, at: 0), stop("r1", .dropoff, at: minute),
                                      ])])
        let payload = try JSONEncoder().encode(DecideRequest(type: "decide", observation: observation))
        let response = LineHandler.handle(line: payload)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: response) as? [String: Any])
        XCTAssertEqual(json["type"] as? String, "action")
        let action = try XCTUnwrap(json["action"] as? [String: Any])
        XCTAssertEqual(action["candidateId"] as? String, "v1:0:1")
        XCTAssertEqual(action["kind"] as? String, "chooseCandidate")
        let malformed = LineHandler.handle(line: Data("{\"type\":\"decide\"}".utf8))
        XCTAssertTrue(String(decoding: malformed, as: UTF8.self).contains("\"type\":\"error\""))
    }
}
