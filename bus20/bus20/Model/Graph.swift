//
//  Graph.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Graph {
    let nodes:[Node]
    private let routes:[[Route]] // shortest routes among all nodes
    
    init(w:Int, h:Int, unit:CGFloat) {
        let count = w * h
        // Create an array of Nodes without real lentgh in Edges
        var nodes:[Node] = (0..<count).map { (index) -> Node in
            let y = index / w
            let x = index - y * w
            var edges = [Edge]()
            if x > 0 {
                edges.append(Edge(from: index, to: index-1, length: unit))
            }
            if x+1 < w {
                edges.append(Edge(from: index, to: index+1, length: unit))
            }
            if y > 0 {
                edges.append(Edge(from: index, to: index-w, length: unit))
            }
            if y+1 < h {
                edges.append(Edge(from: index, to: index+w, length: unit))
            }
            return Node(x: unit * (CGFloat(x + 1) + CGFloat(arc4random() % 24)/32.0 - 0.375),
                        y: unit * (CGFloat(y + 1) + CGFloat(arc4random() % 24)/32.0 - 0.375),
                        edges: edges)
        }
        
        // calculate length
        self.nodes = nodes.map({ (node) -> Node in
            let edges = node.edges.map({ (edge) -> Edge in
                let node0 = nodes[edge.from]
                let node1 = nodes[edge.to]
                return Edge(from: edge.from, to: edge.to, length: node0.distance(to: node1))
            })
            return Node(x: node.x, y: node.y, edges: edges)
        })
        nodes = self.nodes

        // Calcurate shortest routes among all Nodes first
        routes = (0..<count).map({ (index0) -> [Route] in
            print(index0)
            return (0..<count).map({ (index1) -> Route in
                Graph.shortest(nodes: nodes, start: index0, end: index1)
            })
        })
    }
    
    func render(ctx:CGContext, frame:CGRect, scale:CGFloat) {
        UIColor.white.setFill()
        ctx.fill(frame)
        ctx.setLineWidth(Metrics.roadWidth)
        UIColor.lightGray.setFill()
        UIColor.lightGray.setStroke()
        
        for node in nodes {
            node.render(ctx:ctx, nodes:nodes, scale:scale)
        }
    }
    
    var bounds:CGRect {
        let xs = nodes.map { $0.x }
        let ys = nodes.map { $0.y }
        return CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()!, height: ys.max()!)
    }
    
    func route(from:Int, to:Int) -> Route {
        return routes[from][to]
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
            insert(route:Route(edge:edge, extra:endNode.distance(to: nodes[edge.to])))
        }
        
        func propagate(route:Route) {
            let index = route.to
            for edge in nodes[index].edges {
                let type = nodes[edge.to].type
                if type == .empty || type == .end {
                    touch(edge: edge)
                    insert(route:Route(route: route, edge: edge, extra:endNode.distance(to: nodes[edge.to])))
                }
            }
        }
        var first:Route!
        repeat {
            propagate(route: routes.removeFirst())
            first = routes.first!
        } while nodes[first.to].type != .end
        
        return first
    }
}





