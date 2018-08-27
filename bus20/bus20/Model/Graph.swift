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
        UIGraphicsBeginImageContext(frame.size)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        UIColor.yellow.setFill()
        ctx.fill(frame)
        UIColor.gray.setFill()
        for node in nodes {
            node.render(ctx:ctx)
        }
        return UIGraphicsGetImageFromCurrentImageContext()!
    }
}

struct Node {
    let x:CGFloat
    let y:CGFloat
    let edges:[Edge]
    
    func render(ctx:CGContext) {
        let rc = CGRect(x: x, y: y, width: 3.0, height: 3.0)
        ctx.fillEllipse(in: rc)
    }
}

struct Edge {
    let node0:Int // index
    let node1:Int // index
    let biDirectional:Bool
    let length:CGFloat
    init(node0:Int, node1:Int, length:CGFloat=1.0, biDirectional:Bool=true) {
        self.node0 = node0
        self.node1 = node1
        self.length = length
        self.biDirectional = biDirectional
    }
}
