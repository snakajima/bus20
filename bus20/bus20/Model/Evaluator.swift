//
//  Evaluator.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 9/10/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

class Evaluator {
    let routes:[Route];
    var assigned:[Rider];
    var riders:[Rider];

    init(routes:[Route], assigned:[Rider], riders:[Rider]) {
        self.routes = routes;
        self.assigned = assigned;
        self.riders = riders;
    }
    
    func evaluate() -> CGFloat {
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
        }
        return cost
    }
}
