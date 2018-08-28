//
//  Shuttle.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class Shuttle {
    let hue:CGFloat
    var edge:Edge
    var baseTime = CGFloat(0)
    
    init(hue:CGFloat, edge:Edge) {
        self.hue = hue
        self.edge = edge
    }

    func render(ctx:CGContext, graph:Graph, scale:CGFloat, time:CGFloat) {
        while (time - baseTime) > edge.length {
            baseTime += edge.length
            let node = graph.nodes[edge.index1]
            for i in 0..<node.edges.count {
                if node.edges[i].index1 == edge.index0 {
                    let index = i + 1 + Int(arc4random()) % (node.edges.count - 1)
                    edge = node.edges[index % node.edges.count]
                }
            }
        }
        let node0 = graph.nodes[edge.index0]
        let node1 = graph.nodes[edge.index1]
        let x = node0.x + (node1.x - node0.x) * (time - baseTime) / edge.length
        let y = node0.y + (node1.y - node0.y) * (time - baseTime) / edge.length
        let rc = CGRect(x: x * scale - 5, y: y * scale - 5, width: 10, height: 10)
        UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.8).setFill()
        ctx.fillEllipse(in: rc)
    }
}
