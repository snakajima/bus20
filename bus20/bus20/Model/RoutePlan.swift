//
//  RoutePlan.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

// A RoutePlan represents updated routes for a Shuttle to take to carry one more rider
struct RoutePlan {
    let shuttle:Shuttle // Shuttle which may adapt this updated routes
    let cost:CGFloat    // Incremental cost (relative to the cost basis)
    let routes:[Route]  // Updated routes
    
    init(shuttle:Shuttle, cost:CGFloat, routes:[Route]) {
        self.shuttle = shuttle
        self.cost = cost
        self.routes = routes
        // Validation for debugging purpose
        for index in 0..<routes.count-1 {
            assert(routes[index].to == routes[index+1].from)
        }
    }
}



