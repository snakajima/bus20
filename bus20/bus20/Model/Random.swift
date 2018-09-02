//
//  Random.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import Foundation

struct Random {
    static let large = 1 << 31
    static var seed = 0
    static func seed(_ seed:Int) {
        Random.seed = seed
        srand48(seed)
    }

    static func reseed() {
        srand48(Random.seed)
    }

    static func nextSeed() {
        Random.seed += 1
        srand48(Random.seed)
    }

    static func int(_ limit:Int) -> Int {
        return Int(drand48() * Double(large)) % limit
    }

    static func float(_ limit:Double) -> Double {
        return drand48() * limit
    }
}
