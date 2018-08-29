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
    var route:Route
    var baseTime = CGFloat(0)
    
    init(hue:CGFloat, index:Int, graph:Graph) {
        self.hue = hue
        let index1 = (index + 1 + Int(arc4random()) % (graph.nodes.count - 1)) % graph.nodes.count
        self.route = graph.route(from: index, to: index1)
        self.edge = self.route.edges[0]
    }

    func render(ctx:CGContext, graph:Graph, scale:CGFloat, time:CGFloat) {
        while (time - baseTime) > edge.length {
            baseTime += edge.length
            var edges = route.edges
            edges.removeFirst()
            if edges.isEmpty {
                let index1 = (edge.index1 + 1 + Int(arc4random()) % (graph.nodes.count - 1)) % graph.nodes.count
                self.route = graph.route(from: edge.index1, to: index1)
            } else {
                self.route = Route(edges: edges, length: route.length - edge.length)
            }
            self.edge = self.route.edges[0]
        }
        let node0 = graph.nodes[edge.index0]
        let node1 = graph.nodes[edge.index1]
        let ratio = (time - baseTime) / edge.length
        let x = node0.x + (node1.x - node0.x) * ratio
        let y = node0.y + (node1.y - node0.y) * ratio
        let rc = CGRect(x: x * scale - 5, y: y * scale - 5, width: 10, height: 10)
        UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.8).setFill()
        UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.2).setStroke()
        ctx.fillEllipse(in: rc)

        ctx.setLineWidth(10.0)
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        route.render(ctx: ctx, nodes: graph.nodes, scale: scale)
    }
}
