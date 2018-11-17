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
    var shortestRoutes = [[Route]]() // shortest routes among all nodes
    
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
    }
    
    mutating func extraInit(_ callback:@escaping ([[Route]])->()) {
        Graph.allShortestRoutes(nodes: self.nodes) {
            callback($0)
        }
    }
    
    static func getJsonData(file:String) -> Data? {
        let path = Bundle.main.path(forResource: file, ofType: "json")!
        return try? Data(contentsOf: URL(fileURLWithPath: path))
    }
    
    enum GraphError: Error {
        case invalidJsonError
    }
    
    init(file:String) throws {
        guard let jsonData =  Graph.getJsonData(file:file) else {
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
        print("Graph:nodes.count", nodes.count)
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
    static func allShortestRoutes(nodes: [Node], callback:@escaping ([[Route]])->()) {
        var routes = [[Route]](repeating: [Route](), count: nodes.count)
        let start = Date()
        let lockQueue = DispatchQueue(label: "lockQueue")
        DispatchQueue.concurrentPerform(iterations: nodes.count) { (from) in
            let result = shortestRoutesO2(nodes: nodes, from: from)
            lockQueue.async {
                routes[from] = result
            }
        }
        print("Graph:time=", Date().timeIntervalSince(start))

        // Test code
        lockQueue.async {
            routes.forEach {
                assert($0.count == nodes.count)
            }
            DispatchQueue.main.async {
                callback(routes)
            }
        }
    }

    // O(n^3) algorithm (obsolete)
    static func shortestRoutesO3(nodes:[Node], from:Int) -> [Route] {
        return (0..<nodes.count).map({ (to) -> Route in
            Graph.shortest(nodes: nodes, start: from, end: to)
        })
    }
    
    // O(n^2) algorithm
    static func shortestRoutesO2(nodes:[Node], from:Int) -> [Route] {
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
                let newRoute = Route(edges: route.edges + [edge])
                if type == .empty {
                    touch(edge: edge)
                    shortestRoutes[edge.to] = newRoute
                    insert(route:newRoute)
                } else if newRoute.length < shortestRoutes[edge.to].length {
                    for i in 0..<routes.count {
                        if routes[i].to == edge.to {
                            routes.remove(at: i)
                            shortestRoutes[edge.to] = newRoute
                            insert(route:newRoute)
                            break
                        }
                    }
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

        assert(shortestRoutes.count == nodes.count)
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
    
    var boundingBox:CGRect {
        let xs = nodes.map { $0.location.x }
        let ys = nodes.map { $0.location.y }
        let origin = CGPoint(x: xs.min()!, y: ys.min()!)
        let size = CGSize(width: xs.max()! - origin.x, height: ys.max()! - origin.y)
        return CGRect(origin: origin, size: size)
    }
    /*
     var boundingBox:CGRect {
     var origin = nodes[0].location
     nodes.forEach { (node) in
     origin.x = min(node.location.x, origin.x)
     origin.y = min(node.location.y, origin.y)
     }
     var size = CGSize.zero
     nodes.forEach { (node) in
     size.width = min(node.location.x - origin.x, size.width)
     size.height = min(node.location.y - origin.y, size.height)
     }
     return CGRect(origin: origin, size: size)
     }
     */
    

    func route(from:Int, to:Int, rider:Rider? = nil, pickups:Set<Int>? = nil) -> Route {
        assert(from != to)
        var route = shortestRoutes[from][to]
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





