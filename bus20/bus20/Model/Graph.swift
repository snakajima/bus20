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
        let nodes:[Node] = (0..<count).map { (index) -> Node in
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
        self.routes = Graph.allShortestRoutes(nodes: self.nodes)
    }
    
    static func getJsonData() -> Data? {
        let file = "../map"
        let path = Bundle.main.path(forResource: file, ofType: "json")!
        return try? Data(contentsOf: URL(fileURLWithPath: path))
    }
    
    enum GraphError: Error {
        case invalidJsonError
    }
    
    init() throws {
        guard let jsonData =  Graph.getJsonData() else {
            throw GraphError.invalidJsonError
        }
        guard let json = try JSONSerialization.jsonObject(with:jsonData) as? [String:Any] else {
            throw GraphError.invalidJsonError
        }
        guard let nodeArray = json["nodes"] as? [[String:Any]] else {
            throw GraphError.invalidJsonError
        }
        self.nodes = try nodeArray.map{ (node) -> Node in
            guard let edgeArray = node["edges"] as? [[String:Any]] else {
                throw GraphError.invalidJsonError
            }
            let edges = try edgeArray.map{ (edge) -> Edge in
                guard let from = edge["from"] as? Int,
                      let to = edge["to"] as? Int,
                      let length = edge["length"] as? CGFloat else {
                        throw GraphError.invalidJsonError
                }
                return Edge(from:from , to:to  , length:length )
            }
            guard let location = node["location"] as? [String:Any],
                  let x = location["x"] as? CGFloat,
                  let y = location["y"] as? CGFloat else {
                throw GraphError.invalidJsonError
            }
            return Node(location:CGPoint(x:x , y:y ), edges: edges)
        }
        self.routes = Graph.allShortestRoutes(nodes: self.nodes)
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
    
    // Calcurate shortest routes among all Nodes
    static func allShortestRoutes(nodes: [Node]) -> [[Route]] {
        var routes = [[Route]](repeating: [Route](), count: nodes.count)
        let start = Date()
        DispatchQueue.concurrentPerform(iterations: nodes.count) { (from) in
            routes[from] = shortestRoutes2(nodes: nodes, from: from)
        }
        print("Graph:time=", Date().timeIntervalSince(start))
        return routes;
    }

    static func shortestRoutes(nodes:[Node], from:Int) -> [Route] {
        return (0..<nodes.count).map({ (to) -> Route in
            Graph.shortest(nodes: nodes, start: from, end: to)
        })
    }
    
    static func shortestRoutes2(nodes:[Node], from:Int) -> [Route] {
        let routeDummy = Route(edges:[nodes[0].edges[0]], extra:0)
        var shortestRoutes = [Route](repeating: routeDummy, count: nodes.count)
        
        var nodes = nodes // Make a copy
        
        nodes[from] = Node(node:nodes[from], type:.start)
        
        var routes = [Route]()
        func insert(route:Route) {
            for i in 0..<routes.count {
                if route.length < routes[i].length {
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
        func propagate(route:Route) {
            let index = route.to
            for edge in nodes[index].edges {
                let type = nodes[edge.to].type
                if type == .empty {
                    touch(edge: edge)
                    insert(route:Route(edges: route.edges + [edge]))
                }
            }
        }
        
        for edge in nodes[from].edges {
            touch(edge: edge)
            insert(route:Route(edges:[edge]))
        }
        
        for _ in 0..<nodes.count-1 {
            let route = routes.removeFirst()
            shortestRoutes[route.to] = route
            propagate(route: route)
        }

        return shortestRoutes
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

    var dictionary:[String:Any]  {
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
}





