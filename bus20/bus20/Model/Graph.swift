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
    let routes:[[Route]] // shortest routes among all nodes
    
    init(w:Int, h:Int, unit:CGFloat) {
        var nodes = [Node]()
        for y in 0..<h {
            for x in 0..<w {
                let index = y * w + x
                var edges = [Edge]()
                if x > 0 {
                    edges.append(Edge(node0: index, node1: index-1, length: unit))
                }
                if x+1 < w {
                    edges.append(Edge(node0: index, node1: index+1, length: unit))
                }
                if y > 0 {
                    edges.append(Edge(node0: index, node1: index-w, length: unit))
                }
                if y+1 < h {
                    edges.append(Edge(node0: index, node1: index+w, length: unit))
                }
                nodes.append(Node(x: unit * (CGFloat(x + 1) + CGFloat(arc4random() % 24)/32.0 - 0.375),
                                  y: unit * (CGFloat(y + 1) + CGFloat(arc4random() % 24)/32.0 - 0.375), edges: edges))
            }
        }
        
        // calculate length
        self.nodes = nodes.map({ (node) -> Node in
            let edges = node.edges.map({ (edge) -> Edge in
                let node0 = nodes[edge.index0]
                let node1 = nodes[edge.index1]
                return Edge(node0: edge.index0, node1: edge.index1, length: node0.distance(to: node1))
            })
            return Node(x: node.x, y: node.y, edges: edges)
        })

        let count = w * h
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
        ctx.setLineWidth(1.0)
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
            if nodes[edge.index1].type == .empty {
                nodes[edge.index1] = Node(node:nodes[edge.index1], type:.used)
            }
        }
        for edge in nodes[start].edges {
            touch(edge: edge)
            insert(route:Route(edge:edge, extra:endNode.distance(to: nodes[edge.index1])))
        }
        
        func propagate(route:Route) {
            let index = route.lastIndex
            for edge in nodes[index].edges {
                let type = nodes[edge.index1].type
                if type == .empty || type == .end {
                    touch(edge: edge)
                    insert(route:Route(route: route, edge: edge, extra:endNode.distance(to: nodes[edge.index1])))
                }
            }
        }
        var first:Route!
        repeat {
            propagate(route: routes.removeFirst())
            first = routes.first!
        } while nodes[first.lastIndex].type != .end
        
        return first
    }
}





