//
//  Shuttle.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

// A Shuttle represents a shuttle bus who can carry multiple riders.
class Shuttle {
    static var verbose = false
    private let hue:CGFloat
    private let capacity = Metrics.shuttleCapacity
    private var edge:Edge
    private var routes:[Route]
    private var baseTime = CGFloat(0)
    private var assigned = [Rider]()
    private var riders = [Rider]()
    private var location = CGPoint.zero
    
    init(hue:CGFloat, index:Int, graph:Graph) {
        self.hue = hue
        let index1 = (index + 1 + Random.int(graph.nodes.count - 1)) % graph.nodes.count
        self.routes = [graph.route(from: index, to: index1, pickup:nil)]
        //print(self.routes[0])
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
                // Drop riders whose destination is the current node
                riders.forEach {
                    if $0.to == edge.to {
                        if Shuttle.verbose {
                            print("dropped:", $0.id)
                        }
                        $0.state = .done
                    }
                }
                riders = riders.filter { $0.state == .riding }
                
                self.routes.remove(at:0)
                if self.routes.isEmpty {
                    let index1 = (edge.to + 1 + Random.int(graph.nodes.count - 1)) % graph.nodes.count
                    self.routes = [graph.route(from: edge.to, to: index1, pickup:nil)]
                } else {
                    // Pick riders who are waiting at the current node
                    assigned.forEach {
                        if routes[0].pickups.contains($0.id) {
                            assert($0.from == edge.to)
                            if Shuttle.verbose {
                                print("picked:", $0.id)
                            }
                            $0.state = .riding
                            riders.append($0)
                        }
                    }
                    routes[0].pickups.removeAll()
                    assigned = assigned.filter { $0.state == .assigned }
                    
                    assert(riders.count <= capacity)
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
        location.x = node0.location.x + (node1.location.x - node0.location.x) * ratio
        location.y = node0.location.y + (node1.location.y - node0.location.y) * ratio
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
            routes[0] = graph.route(from: edge.from, to: edge.to, pickup:nil)
            routes.insert(graph.route(from: edge.to, to: route.to, pickup:nil), at: 1)
        }
 
        let costBasis = evaluate(routes: routes, rider: nil)
        
        // All possible insertion cases
        var plans = (1..<routes.count).flatMap { (index0) -> [RoutePlan] in
            var routes0 = routes
            let route = routes0[index0]
            
            // Process insertion
            if route.from == rider.from {
                routes0[index0] = graph.route(from: route.from, to: route.to, basedOn:route, pickup:rider)
            } else if route.to == rider.from {
                if index0+1 < routes.count {
                    let routeNext = routes0[index0+1]
                    routes0[index0+1] = graph.route(from: routeNext.from, to: routeNext.to, basedOn:routeNext, pickup:rider)
                } else {
                    routes0.append(graph.route(from: rider.from, to: rider.to, pickup:rider))
                }
            } else {
                routes0[index0] = graph.route(from: route.from, to: rider.from, basedOn:route, pickup:nil)
                routes0.insert(graph.route(from: rider.from, to: route.to, pickup:rider), at: index0+1)
            }
            return (index0+1..<routes.count).flatMap { (index1) -> [RoutePlan] in
                var routes1 = routes0
                let route = routes1[index1]
                if route.from != rider.to && route.to != rider.to {
                    routes1[index1] = graph.route(from: route.from, to: rider.to, basedOn: route, pickup:nil)
                    routes1.insert(graph.route(from: rider.to, to: route.to, pickup: nil), at: index1+1)
                } // else { print("optimized") }
                let cost = evaluate(routes: routes1, rider: rider)
                return [RoutePlan(shuttle:self, cost:cost - costBasis, routes:routes1)]
            }
        }
        
        // Append case
        if (assigned.count + riders.count == 0) {
            routes = [routes[0]]
        }
        if let last = routes.last?.to, last != rider.from {
            routes.append(graph.route(from: last, to: rider.from, pickup:nil))
        }
        routes.append(graph.route(from:rider.from, to:rider.to, pickup:rider))
        let cost = evaluate(routes: routes, rider: rider)
        plans.append(RoutePlan(shuttle:self, cost:cost - costBasis, routes:routes))
        
        return plans
    }

    func evaluate(routes:[Route], rider:Rider?) -> CGFloat {
        var assignedExtra = self.assigned
        if let rider = rider {
            assignedExtra.append(rider)
        }
        
        let evaluator = Evaluator(routes: routes, capacity:capacity, riders: self.riders + assignedExtra);
        evaluator.process()
        return evaluator.cost()
    }
    
    func evaluator() -> Evaluator {
        return Evaluator(routes: routes, capacity:capacity, riders: riders + assigned);
    }
    
    func adapt(plan:RoutePlan, rider:Rider, graph:Graph) {
        // debug code
        var indeces = plan.routes.map { (route) -> Int in
            route.from
        }
        indeces.append(plan.routes.last!.to)
        
        if Shuttle.verbose {
            print("SH", rider.id, ":", [rider.from, rider.to], "→", indeces)
            plan.routes.forEach { (route) in
                print(" ", route)
            }
        }

        self.routes = plan.routes
        self.assigned.append(rider)
        rider.state = .assigned
        rider.hue = self.hue
    }
}


