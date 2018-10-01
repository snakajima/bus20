//
//  Evaluator.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 9/10/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

// An Evaluator object is created when a Shuttle needs to determine the "cost" of
// a particular route (a series of Route objects) to move a set or riders
// to their destinations.
class Evaluator {
    private struct RiderCost {
        let rider:Rider
        var state:RiderState
        var waitTime = CGFloat(0)
        var rideTime = CGFloat(0)
        init(rider:Rider, state:RiderState) {
            self.rider = rider;
            self.state = state;
        }
    }

    static var verbose = false
    
    private let routes:[Route]
    private let capacity:Int
    private var riders:[Rider]
    private var costs = [RiderCost]()
    private var costExtra = CGFloat(0)

    init(routes:[Route], capacity:Int, riders:[Rider], time:CGFloat) {
        self.routes = routes
        self.capacity = capacity
        self.riders = riders
        process(time:time)
    }
    
    // Calculate the wait time and ride time of each rider, and
    // also detect the over capacity situation (costExtra).
    private func process(time:CGFloat) {
        // Initialize costs and costExtra
        self.costs = riders.map {
            var cost = RiderCost(rider: $0, state: $0.state)
            cost.waitTime = $0.pickupTime - $0.startTime
            cost.rideTime = time - $0.pickupTime
            return cost
        }
        costExtra = 0
        
        routes.forEach { (route) in
            // pick up riders at the begenning of this section
            for (index,cost) in costs.enumerated() {
                if route.pickups.contains(cost.rider.id) {
                    assert(cost.rider.from == route.from)
                    assert(cost.state == .waiting)
                    costs[index].state = .riding
                }
                
                if cost.state == .waiting {
                    costs[index].waitTime += route.length
                }
            }
            
            // detect over capacity
            if costs.filter({ $0.state == .riding }).count > capacity {
                costExtra += 1.0e10; // large enough penalty
            }
            
            // drop riders at the end of section
            for (index,cost) in costs.enumerated() {
                if costs[index].state == .riding {
                    costs[index].rideTime += route.length
                    if cost.rider.to == route.to {
                        costs[index].state = .done
                    }
                }
            }
        }
    }
    
    // Calculate the cost of this route.
    func cost() -> CGFloat {
        let cost = costs.reduce(CGFloat(0.0)) { (total, cost) -> CGFloat in
            assert(cost.state == .done)
            let time = cost.waitTime + cost.rideTime - cost.rider.route.length
            return total + time * time
        }
        return cost + costExtra
    }
}

extension Evaluator: CustomStringConvertible {
    var description: String {
        return costs.map{
            String(format: "W:%.2f R:%.2f M:%.2f",
                   $0.waitTime, $0.rideTime, $0.rider.route.length)
        }.joined(separator: "\n")
    }
}

