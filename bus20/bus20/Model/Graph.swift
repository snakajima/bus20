//
//  Graph.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit
import CoreGraphics

struct Graph {
    let nodes:[Node]
    
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
                nodes.append(Node(x: unit * CGFloat(x), y: unit * CGFloat(y), edges: edges))
            }
        }
        self.nodes = nodes
    }
    
    func render(frame:CGRect, scale:CGFloat) -> UIImage {
        UIGraphicsBeginImageContextWithOptions(frame.size, true, 0.0)
        defer { UIGraphicsEndImageContext() }

        let ctx = UIGraphicsGetCurrentContext()!
        UIColor.white.setFill()
        ctx.fill(frame)
        ctx.setLineWidth(1.0)
        UIColor.gray.setFill()
        UIColor.gray.setStroke()
        
        for node in nodes {
            node.render(ctx:ctx, graph:self, scale:scale)
        }
        return UIGraphicsGetImageFromCurrentImageContext()!
    }
    
    var bounds:CGRect {
        let xs = nodes.map { $0.x }
        let ys = nodes.map { $0.y }
        return CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()!, height: ys.max()!)
    }
    
    func shortest(start:Int, end:Int) -> Route {
        var nodes = self.nodes
        nodes[start] = Node(node:nodes[start], type:.start)
        nodes[end] = Node(node:nodes[end], type:.end)

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
            if nodes[edge.index1].type == .empty {
                nodes[edge.index1] = Node(node:nodes[edge.index1], type:.used)
            }
        }
        for edge in nodes[start].edges {
            touch(edge: edge)
            insert(route:Route(edge:edge))
        }
        
        func propagate(route:Route) {
            let index = route.lastIndex
            for edge in nodes[index].edges {
                let type = nodes[edge.index1].type
                if type == .empty || type == .end {
                    touch(edge: edge)
                    insert(route:Route(route: route, edge: edge))
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

struct Node {
    enum NodeType {
        case empty
        case start
        case end
        case used
    }
    
    let x:CGFloat
    let y:CGFloat
    let edges:[Edge]
    let type:NodeType
    
    init(x:CGFloat, y:CGFloat, edges:[Edge]) {
        self.x = x
        self.y = y
        self.edges = edges
        self.type = .empty
    }
    
    init(node:Node, type:NodeType) {
        self.x = node.x
        self.y = node.y
        self.edges = node.edges
        self.type = type
    }
    
    func render(ctx:CGContext, graph:Graph, scale:CGFloat) {
        let rc = CGRect(x: x * scale - 2, y: y * scale - 2, width: 4, height: 4)
        ctx.fillEllipse(in: rc)
        
        ctx.beginPath()
        for edge in edges {
            edge.addPath(ctx: ctx, graph: graph, scale: scale)
        }
        ctx.closePath()
        ctx.drawPath(using: .stroke)
    }
}

struct Edge {
    let index0:Int
    let index1:Int
    let length:CGFloat
    init(node0:Int, node1:Int, length:CGFloat=1.0) {
        self.index0 = node0
        self.index1 = node1
        self.length = length
    }

    func addPath(ctx:CGContext, graph:Graph, scale:CGFloat) {
        let node0 = graph.nodes[index0]
        let node1 = graph.nodes[index1]
        ctx.move(to: CGPoint(x: node0.x * scale, y: node0.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))
    }
}

struct Route {
    private let edges:[Edge]
    let length:CGFloat
    
    init(edge:Edge) {
        edges = [edge]
        length = edge.length
    }
    
    init(route:Route, edge:Edge) {
        var edges = route.edges
        edges.append(edge)
        self.edges = edges
        length = route.length + edge.length
    }
    
    func render(ctx:CGContext, graph:Graph, scale:CGFloat) {
        guard let first = edges.first else {
            return
        }
        let node0 = graph.nodes[first.index0]
        ctx.move(to: CGPoint(x: node0.x * scale, y: node0.y * scale))
        for edge in edges {
            let node = graph.nodes[edge.index1]
            ctx.addLine(to: CGPoint(x: node.x * scale, y: node.y * scale))
        }
        ctx.drawPath(using: .stroke)
    }
    
    var lastIndex:Int {
        let last = edges.last!
        return last.index1
    }
}
