//
//  Graph.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Graph {
    static var verbose = false
    private let nodes:[Node]
    private let routes:[[Route]] // shortest routes among all nodes
    
    init(w:Int, h:Int, unit:CGFloat) {
        let count = w * h
        Random.seed(0)
        // Create an array of Nodes without real lentgh in Edges
        var nodes:[Node] = (0..<count).map { (index) -> Node in
            let y = index / w
            let x = index - y * w
            let edges = [
                (x > 0) ? Edge(from: index, to: index-1, length: unit) : nil,
                (x < w-1) ? Edge(from: index, to: index+1, length: unit) : nil,
                (y > 0) ? Edge(from: index, to: index-w, length: unit) : nil,
                (y < h-1) ? Edge(from: index, to: index+w, length: unit) : nil,
            ]
            return Node(location:CGPoint(x: unit * (CGFloat(x + 1) + CGFloat(Random.float(0.75)) - 0.375),
                        y: unit * (CGFloat(y + 1) + CGFloat(Random.float(0.75)) - 0.375)),
                        edges: edges.compactMap {$0})
        }

        // calculate length
        self.nodes = Graph.updateLength(nodes: nodes)
        self.routes = Graph.allShortestRoute(nodes: self.nodes)
    }
    init() {
        let data: Data =  Graph.sample.data(using: String.Encoding.utf8)!

        let json = try! JSONSerialization.jsonObject(with: data)
        let json_nodes = json as! NSDictionary
        let nodes:[Node] = (json_nodes["nodes"] as! NSArray).map{ (node) -> Node in
            let node_edges = node as! NSDictionary
            let edges = (node_edges["edges"] as! NSArray).map{ (edg) -> Edge in
                let edge = edg as! NSDictionary
                return Edge(from: edge["from"] as! Int, to: edge["to"] as! Int , length: edge["length"] as! CGFloat)
            }
            let location = node_edges["location"] as! NSDictionary
            return Node(location:CGPoint(x: location["x"] as! CGFloat, y: location["y"] as! CGFloat), edges: edges)
        }
        self.nodes = Graph.updateLength(nodes: nodes)
        self.routes = Graph.allShortestRoute(nodes: self.nodes)
    }
    static func updateLength(nodes: [Node]) -> [Node] {
        return nodes.map({ (node) -> Node in
            let edges = node.edges.map({ (edge) -> Edge in
                let node0 = nodes[edge.from]
                let node1 = nodes[edge.to]
                return Edge(from: edge.from, to: edge.to, length: node0.distance(to: node1))
            })
            return Node(location: node.location, edges: edges)
        })
    }
    static func allShortestRoute(nodes: [Node]) -> [[Route]] {
        let count = nodes.count
        // Calcurate shortest routes among all Nodes
        let routeDummy = Route(edges:[nodes[0].edges[0]], extra:0)
        var routes = (0..<count).map { (index0) -> [Route] in
            return [routeDummy]
        }
        DispatchQueue.concurrentPerform(iterations: count) { (index0) in
            if Graph.verbose {
                print(index0, Thread.current)
            }
            routes[index0] = (0..<count).map({ (index1) -> Route in
                Graph.shortest(nodes: nodes, start: index0, end: index1)
            })
        }
        return routes;
    }
    
    func randamRoute(from:Int? = nil) -> Route {
        let from = from ?? Random.int(self.nodes.count)
        let to = (from + 1 + Random.int(self.nodes.count - 1)) % self.nodes.count
        return self.route(from: from, to: to)
    }
    
    func location(at index:Int) -> CGPoint {
        return nodes[index].location
    }

    func render(ctx:CGContext, frame:CGRect, scale:CGFloat) {
        UIColor.white.setFill()
        ctx.fill(frame)
        ctx.setLineWidth(Metrics.roadWidth)
        UIColor.lightGray.setFill()
        UIColor.lightGray.setStroke()
        
        for node in nodes {
            node.render(ctx:ctx, graph:self, scale:scale)
        }
    }

    var dictionary:Dictionary<String, Any>  {
        return [
            "nodes": self.nodes.map { $0.dictionary}
        ]
    }
    
    var json: String {
        let jsonData =  try! JSONSerialization.data(withJSONObject: dictionary);
        return String(bytes: jsonData, encoding: .utf8)!
    }
    
    var bounds:CGRect {
        let xs = nodes.map { $0.location.x }
        let ys = nodes.map { $0.location.y }
        return CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()!, height: ys.max()!)
    }
    
    func route(from:Int, to:Int, rider:Rider? = nil, pickups:Set<Int>? = nil) -> Route {
        assert(from != to)
        var route = routes[from][to]
        route.pickups = pickups ?? Set<Int>()
        if let rider = rider {
            route.pickups.insert(rider.id)
        }
        return route
    }

    private static func shortest(nodes:[Node], start:Int, end:Int) -> Route {
        var nodes = nodes
        nodes[start] = Node(node:nodes[start], type:.start)
        nodes[end] = Node(node:nodes[end], type:.end)
        let endNode = nodes[end]

        var routes = [Route]()
        func insert(route:Route) {
            for i in 0..<routes.count {
                if route.length + route.extra < routes[i].length + routes[i].extra {
                    routes.insert(route, at: i)
                    return
                }
            }
            routes.append(route)
        }
        func touch(edge:Edge) {
            if nodes[edge.to].type == .empty {
                nodes[edge.to] = Node(node:nodes[edge.to], type:.used)
            }
        }
        for edge in nodes[start].edges {
            touch(edge: edge)
            insert(route:Route(edges:[edge], extra:endNode.distance(to: nodes[edge.to])))
        }
        
        func propagate(route:Route) {
            let index = route.to
            for edge in nodes[index].edges {
                let type = nodes[edge.to].type
                if type == .empty || type == .end {
                    touch(edge: edge)
                    insert(route:Route(edges: route.edges + [edge], extra:endNode.distance(to: nodes[edge.to])))
                }
            }
        }
        while let first = routes.first, nodes[first.to].type != .end {
            propagate(route: routes.removeFirst())
        }
        
        return routes.first!
    }

    static var sample: String {
        return "{\"nodes\":[{\"location\":{\"y\":1.1874264853637229,\"x\":0.75312102707971729},\"edges\":[{\"from\":0,\"to\":1,\"length\":0.94847773133838398},{\"from\":0,\"to\":3,\"length\":0.81419156491909228}]},{\"location\":{\"y\":1.2778489202703067,\"x\":1.6972787417176756},\"edges\":[{\"from\":1,\"to\":0,\"length\":0.94847773133838398},{\"from\":1,\"to\":2,\"length\":1.3621797415558023},{\"from\":1,\"to\":4,\"length\":1.0774270837014885}]},{\"location\":{\"y\":1.2143494441297555,\"x\":3.0579776300963308},\"edges\":[{\"from\":2,\"to\":1,\"length\":1.3621797415558023},{\"from\":2,\"to\":5,\"length\":0.68307760584005073}]},{\"location\":{\"y\":1.9015747024403158,\"x\":1.1441456150939802},\"edges\":[{\"from\":3,\"to\":4,\"length\":1.1708120876310373},{\"from\":3,\"to\":0,\"length\":0.81419156491909228},{\"from\":3,\"to\":6,\"length\":0.91908954849875946}]},{\"location\":{\"y\":2.1838213238375488,\"x\":2.2804280576463567},\"edges\":[{\"from\":4,\"to\":3,\"length\":1.1708120876310373},{\"from\":4,\"to\":5,\"length\":0.73982598883618211},{\"from\":4,\"to\":1,\"length\":1.0774270837014885},{\"from\":4,\"to\":7,\"length\":1.0851253359454138}]},{\"location\":{\"y\":1.8902961523200315,\"x\":2.9595344318198338},\"edges\":[{\"from\":5,\"to\":4,\"length\":0.73982598883618211},{\"from\":5,\"to\":2,\"length\":0.68307760584005073},{\"from\":5,\"to\":8,\"length\":1.2043143111162355}]},{\"location\":{\"y\":2.8201665008121601,\"x\":1.1743897240019043},\"edges\":[{\"from\":6,\"to\":7,\"length\":0.84089728964487287},{\"from\":6,\"to\":3,\"length\":0.91908954849875946}]},{\"location\":{\"y\":3.2075924634192123,\"x\":1.920720331192908},\"edges\":[{\"from\":7,\"to\":6,\"length\":0.84089728964487287},{\"from\":7,\"to\":8,\"length\":1.3465213984108553},{\"from\":7,\"to\":4,\"length\":1.0851253359454138}]},{\"location\":{\"y\":3.0568411503620823,\"x\":3.2587763531852145},\"edges\":[{\"from\":8,\"to\":7,\"length\":1.3465213984108553},{\"from\":8,\"to\":5,\"length\":1.2043143111162355}]}]}"
    }
}





