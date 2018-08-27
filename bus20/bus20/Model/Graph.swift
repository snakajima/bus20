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
        for x in 0..<w {
            for y in 0..<h {
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
    
    func render(frame:CGRect) -> UIImage {
        UIGraphicsBeginImageContextWithOptions(frame.size, true, 0.0)
        defer { UIGraphicsEndImageContext() }

        let bounds = self.bounds
        let scale = min(frame.size.width / bounds.size.width,
                        frame.size.height / bounds.size.height)

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
}

struct Node {
    let x:CGFloat
    let y:CGFloat
    let edges:[Edge]
    
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
    let index0:Int // index
    let index1:Int // index
    let biDirectional:Bool
    let length:CGFloat
    init(node0:Int, node1:Int, length:CGFloat=1.0, biDirectional:Bool=true) {
        self.index0 = node0
        self.index1 = node1
        self.length = length
        self.biDirectional = biDirectional
    }

    func addPath(ctx:CGContext, graph:Graph, scale:CGFloat) {
        let node0 = graph.nodes[index0]
        let node1 = graph.nodes[index1]
        ctx.move(to: CGPoint(x: node0.x * scale, y: node0.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))
    }
}

struct Route {
    private var edges:[Edge]
    
    mutating func add(edge:Edge) {
        if let last = edges.last {
            assert(last.index1 == edge.index0)
        }
        edges.append(edge)
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
    }
}
