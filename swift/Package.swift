// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Bus20Reference",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "Bus20Core", targets: ["Bus20Core"]),
        .executable(name: "bus20-baseline", targets: ["Bus20Baseline"]),
    ],
    targets: [
        .target(name: "Bus20Core"),
        .executableTarget(name: "Bus20Baseline", dependencies: ["Bus20Core"]),
        .testTarget(name: "Bus20CoreTests", dependencies: ["Bus20Core"]),
    ]
)
