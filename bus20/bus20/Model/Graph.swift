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
    
    init(w:Int, h:Int, unit:Float) {
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
                nodes.append(Node(x: unit * Float(x), y: unit * Float(y), edges: edges))
            }
        }
        self.nodes = nodes
    }
    
    var image:UIImage {
        let rc = CGRect(x: 0, y: 0, width: 200, height: 200)
        UIGraphicsBeginImageContext(rc.size)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        UIColor.yellow.setFill()
        ctx.fill(rc)
        return UIGraphicsGetImageFromCurrentImageContext()!
    }
}

struct Node {
    let x:Float
    let y:Float
    let edges:[Edge]
}

struct Edge {
    let node0:Int // index
    let node1:Int // index
    let biDirectional:Bool
    let length:Float
    init(node0:Int, node1:Int, length:Float=1.0, biDirectional:Bool=true) {
        self.node0 = node0
        self.node1 = node1
        self.length = length
        self.biDirectional = biDirectional
    }
}
