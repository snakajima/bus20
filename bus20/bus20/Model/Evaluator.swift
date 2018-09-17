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
    private var assigned:[Rider]
    private var riders:[Rider]
    private var costs = [RiderCost]()
    private var costExtra = CGFloat(0)

    init(routes:[Route], capacity:Int, assigned:[Rider], riders:[Rider]) {
        self.routes = routes
        self.capacity = capacity
        self.assigned = assigned
        self.riders = riders
    }
    
    // Calculate the wait time and ride time of each rider, and
    // also detect the over capacity situation (costExtra).
    func process() {
        // Initialize costs and costExtra
        self.costs = riders.map { RiderCost(rider: $0, state: .riding) }
        assigned.forEach { self.costs.append(RiderCost(rider: $0, state: .assigned)) }
        costExtra = 0
        
        // Handle a special case where the rider is getting off at the very first node.
        for (index,cost) in costs.enumerated() {
            if cost.state == .riding && cost.rider.to == routes[0].from {
                costs[index].state = .done
            }
        }
        
        routes.forEach { (route) in
            // pick up riders at the begenning of this section
            for (index,cost) in costs.enumerated() {
                if route.pickups.contains(cost.rider.id) {
                    assert(cost.rider.from == route.from)
                    assert(cost.state == .assigned)
                    costs[index].state = .riding
                    
                    if Evaluator.verbose {
                        print("EV:picked:", cost.rider.id)
                    }
                }
                
                if cost.state == .assigned {
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
                        if Evaluator.verbose {
                            print("EV:dropped:", cost.rider.id)
                        }
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
        return costs.reduce("", { (result, cost) -> String in
            return result + String(format: "W:%.2f R:%.2f M:%.2f\n", cost.waitTime, cost.rideTime, cost.rider.route.length)
        })
    }
}

