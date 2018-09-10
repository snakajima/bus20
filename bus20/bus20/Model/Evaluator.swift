//
//  Evaluator.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 9/10/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

struct RiderCost {
    let rider:Rider
    var state:RiderState
    var waitTime = CGFloat(0)
    var rideTime = CGFloat(0)
    init(rider:Rider, state:RiderState) {
        self.rider = rider;
        self.state = state;
    }
}

class Evaluator {
    let routes:[Route];
    var assigned:[Rider];
    var riders:[Rider];
    var costs:[RiderCost];

    init(routes:[Route], assigned:[Rider], riders:[Rider]) {
        self.routes = routes;
        self.assigned = assigned;
        self.riders = riders;
        self.costs = riders.map { RiderCost(rider: $0, state: .riding) }
        assigned.forEach { self.costs.append(RiderCost(rider: $0, state: .assigned)) }
    }
    
    func evaluate_obsolete() -> CGFloat {
        var cost = CGFloat(0)
        riders = riders.filter({ (rider) -> Bool in
            return routes[0].from != rider.to
        })
        routes.forEach { (route) in
            assigned = assigned.filter({ (rider) -> Bool in
                if route.from != rider.from {
                    return true
                }
                riders.append(rider)
                return false
            })
            cost += CGFloat(assigned.count + riders.count) * route.length
            riders = riders.filter({ (rider) -> Bool in
                return route.to != rider.to
            })
            //print(cost);
        }
        assert(assigned.count == 0)
        assert(riders.count == 0)
        print("cost=", cost)
        print("evaluate2=", evaluate())

        return cost
    }
    
    func evaluate() -> CGFloat {
        // Handle a special case where the rider is getting of at the very first node.
        for (index,cost) in costs.enumerated() {
            if cost.state == .riding && cost.rider.to == routes[0].from {
                costs[index].state = .done
            }
        }
        routes.forEach { (route) in
            for (index,cost) in costs.enumerated() {
                if cost.state == .assigned && cost.rider.from == route.from {
                    costs[index].state = .riding
                }
                
                if cost.state == .assigned {
                    costs[index].waitTime += route.length
                }
                if costs[index].state == .riding {
                    costs[index].rideTime += route.length
                    if cost.rider.to == route.to {
                        costs[index].state = .done
                    }
                }
            }
            /*
            let costX = costs.reduce(CGFloat(0.0)) { (total, cost) -> CGFloat in
                return total + cost.waitTime + cost.rideTime
            }
            print(costX)
            */
        }
        let cost = costs.reduce(CGFloat(0.0)) { (total, cost) -> CGFloat in
            assert(cost.state == .done)
            let time = cost.waitTime + cost.rideTime
            return total + time * time
        }
        return cost
    }
}
