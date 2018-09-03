//
//  Shuttle.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class Shuttle {
    struct RoutePlan {
        let shuttle:Shuttle
        let cost:CGFloat
        let routes:[Route]
        
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
    
    private let hue:CGFloat
    private var edge:Edge
    private var routes:[Route]
    private var baseTime = CGFloat(0)
    private var assigned = [Rider]()
    private var riders = [Rider]()
    private var location = CGPoint.zero
    
    init(hue:CGFloat, index:Int, graph:Graph) {
        self.hue = hue
        let index1 = (index + 1 + Random.int(graph.nodes.count - 1)) % graph.nodes.count
        self.routes = [graph.route(from: index, to: index1)]
        print(self.routes[0])
        self.edge = self.routes[0].edges[0]
    }
    
    // for debugging
    deinit {
        print("Shuttle:deinit")
    }

    // Update the status of shuttle based on the curren time.
    func update(graph:Graph, time:CGFloat) {
        while (time - baseTime) > edge.length {
            baseTime += edge.length
            var edges = routes[0].edges
            assert(edges[0].to == edge.to && edges[0].from == edge.from)
            edges.removeFirst()

            // Check if we are at the end of a route section, which incidates
            // that we are likely to pick up or drop some riders
            if edges.isEmpty {
                // Pick riders who are waiting at the current node
                assigned.forEach {
                    if $0.from == edge.to {
                        $0.state = .riding
                        riders.append($0)
                    }
                }
                assigned = assigned.filter { $0.state == .assigned }

                // Drop riders whose destination is the current node
                riders.forEach {
                    if $0.to == edge.to {
                        $0.state = .done
                    }
                }
                riders = riders.filter { $0.state == .riding }
                
                self.routes.remove(at:0)
                if self.routes.isEmpty {
                    let index1 = (edge.to + 1 + Random.int(graph.nodes.count - 1)) % graph.nodes.count
                    self.routes = [graph.route(from: edge.to, to: index1)]
                }
            } else {
                self.routes[0] = Route(edges: edges, length: routes[0].length - edge.length)
            }
            self.edge = self.routes[0].edges[0]
        }

        // Update the locations of this shuttle and riders
        let node0 = graph.nodes[edge.from]
        let node1 = graph.nodes[edge.to]
        let ratio = (time - baseTime) / edge.length
        location.x = node0.x + (node1.x - node0.x) * ratio
        location.y = node0.y + (node1.y - node0.y) * ratio
        riders.forEach { $0.location = location }

        // This is only for display (UI)
        for index in 0..<riders.count {
            riders[index].offset = index
        }
    }
    
    func render(ctx:CGContext, graph:Graph, scale:CGFloat, time:CGFloat) {
        // Render the shuttle
        let rc = CGRect(x: location.x * scale - Metrics.shuttleRadius, y: location.y * scale - Metrics.shuttleRadius, width: Metrics.shuttleRadius * 2, height: Metrics.shuttleRadius * 2)
        UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: Metrics.shuttleAlpha).setFill()
        ctx.fillEllipse(in: rc)

        // Render the scheduled routes
        if assigned.count + riders.count > 0 {
            ctx.setLineWidth(Metrics.routeWidth)
            ctx.setLineCap(.round)
            ctx.setLineJoin(.round)
            for route in routes {
                UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: Metrics.routeAlpha).setStroke()
                route.render(ctx: ctx, nodes: graph.nodes, scale: scale)
            }
        }
    }
    
    // Returns the list of possible plans to carry the specified rider
    func plans(rider:Rider, graph:Graph) -> [RoutePlan] {
        var routes = self.routes
        
        // Make it sure that the first route is a single-edge route
        if let route = routes.first, route.edges.count > 1 {
            let edge = route.edges[0]
            routes[0] = graph.route(from: edge.from, to: edge.to)
            routes.insert(graph.route(from: edge.to, to: route.to), at: 1)
        }
 
        let costBasis = evaluate(routes: routes, rider: nil)
        
        // All possible insertion cases
        var plans = (1..<routes.count).flatMap { (index0) -> [RoutePlan] in
            var routes0 = routes
            let route = routes0[index0]
            if route.from != rider.from && route.to != rider.from {
                routes0[index0] = graph.route(from: route.from, to: rider.from)
                routes0.insert(graph.route(from: rider.from, to: route.to), at: index0+1)
            } else {
                // One of the nodes happened to match the rider's starting node.
                print("optimized")
            }
            return (index0+1..<routes.count).flatMap { (index1) -> [RoutePlan] in
                var routes1 = routes0
                let route = routes1[index1]
                if route.from != rider.to && route.to != rider.to {
                    routes1[index1] = graph.route(from: route.from, to: rider.to)
                    routes1.insert(graph.route(from: rider.to, to: route.to), at: index1+1)
                } else { print("optimized") }
                let cost = evaluate(routes: routes1, rider: rider)
                return [RoutePlan(shuttle:self, cost:cost - costBasis, routes:routes1)]
            }
        }
        
        // Append case
        if (assigned.count + riders.count == 0) {
            routes = [routes[0]]
        }
        if let last = routes.last?.to, last != rider.from {
            routes.append(graph.route(from: last, to: rider.from))
        }
        routes.append(graph.route(from:rider.from, to:rider.to))
        let cost = evaluate(routes: routes, rider: rider)
        plans.append(RoutePlan(shuttle:self, cost:cost - costBasis, routes:routes))
        
        return plans
    }

    func evaluate(routes:[Route], rider:Rider?) -> CGFloat {
        var assigned = self.assigned
        var riders = self.riders
        if let rider = rider {
            assigned.append(rider)
        }
        
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
    
    func adapt(plan:RoutePlan, rider:Rider, graph:Graph) {
        // debug code
        var indeces = plan.routes.map { (route) -> Int in
            route.from
        }
        indeces.append(plan.routes.last!.to)
        print([rider.from, rider.to], "→", indeces)
        plan.routes.forEach { (route) in
            print(" ", route)
        }

        self.routes = plan.routes
        self.assigned.append(rider)
        rider.state = .assigned
        rider.hue = self.hue
    }
}


