import Bus20Core
import Foundation

// Headless Swift reference: reads one JSON request per line on stdin and
// writes one JSON response per line on stdout. It keeps no clock and no
// state between lines; the TypeScript host owns the simulation.
setvbuf(stdout, nil, _IOLBF, 0)
while let line = readLine(strippingNewline: true) {
    if line.isEmpty {
        continue
    }
    let response = LineHandler.handle(line: Data(line.utf8))
    FileHandle.standardOutput.write(response)
    FileHandle.standardOutput.write(Data("\n".utf8))
}
