import Foundation

/// JSON Lines protocol between the TypeScript host and this CLI.
/// Request:  {"type":"decide","observation":{...}}
/// Response: {"type":"action","action":{...},"diagnostics":{...}}
///        or {"type":"error","message":"..."}
public struct DecideRequest: Codable {
    public let type: String
    public let observation: Observation
}

public struct Diagnostics: Codable, Equatable {
    public let incrementalCostMs2: Int
    public let candidatesEvaluated: Int
    public let version: String
}

public enum Response: Equatable {
    case action(ChooseCandidateAction, Diagnostics)
    case error(String)

    public func encoded() throws -> Data {
        var object: [String: Any]
        switch self {
        case let .action(action, diagnostics):
            object = [
                "type": "action",
                "action": try jsonObject(action),
                "diagnostics": try jsonObject(diagnostics),
            ]
        case let .error(message):
            object = ["type": "error", "message": message]
        }
        return try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
    }
}

func jsonObject<T: Encodable>(_ value: T) throws -> Any {
    let data = try JSONEncoder().encode(value)
    return try JSONSerialization.jsonObject(with: data)
}

public enum LineHandler {
    /// Handles one request line and returns one response line (without newline).
    public static func handle(line: Data) -> Data {
        let response: Response
        do {
            let request = try JSONDecoder().decode(DecideRequest.self, from: line)
            guard request.type == "decide" else {
                throw ProtocolFailure.unknownType(request.type)
            }
            let choice = try Reference.choose(request.observation)
            let action = ChooseCandidateAction(stateVersion: request.observation.stateVersion,
                                               candidateId: choice.candidateId)
            let diagnostics = Diagnostics(incrementalCostMs2: choice.incrementalCostMs2,
                                          candidatesEvaluated: choice.candidatesEvaluated,
                                          version: Reference.version)
            response = .action(action, diagnostics)
        } catch {
            response = .error(String(describing: error))
        }
        do {
            return try response.encoded()
        } catch {
            return Data("{\"type\":\"error\",\"message\":\"encoding failed\"}".utf8)
        }
    }

    enum ProtocolFailure: Error {
        case unknownType(String)
    }
}
