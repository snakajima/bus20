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
    private var costs:[RiderCost]
    private var costExtra = CGFloat(0)

    init(routes:[Route], capacity:Int, assigned:[Rider], riders:[Rider]) {
        self.routes = routes
        self.capacity = capacity
        self.assigned = assigned
        self.riders = riders
        self.costs = riders.map { RiderCost(rider: $0, state: .riding) }
        assigned.forEach { self.costs.append(RiderCost(rider: $0, state: .assigned)) }
    }
    
    func process() {
        for index in 0..<costs.count {
            costs[index].waitTime = 0
            costs[index].rideTime = 0
        }
        costExtra = 0
        
        // Handle a special case where the rider is getting off at the very first node.
        for (index,cost) in costs.enumerated() {
            if cost.state == .riding && cost.rider.to == routes[0].from {
                costs[index].state = .done
            }
        }
        routes.forEach { (route) in
            for (index,cost) in costs.enumerated() {
                if cost.state == .assigned
                   && route.pickups.contains(cost.rider.id) {
                    assert(cost.rider.from == route.from)
                    costs[index].state = .riding
                    
                    if Evaluator.verbose {
                        print("EV:picked:", cost.rider.id)
                    }
                }
                
                if cost.state == .assigned {
                    costs[index].waitTime += route.length
                }
            }
            if costs.filter({ $0.state == .riding }).count > capacity {
                costExtra += 1.0e10; // large enough penalty
            }
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

