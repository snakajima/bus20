//
//  Route.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Route {
    private let edges:[Edge]
    let length:CGFloat
    let extra:CGFloat
    
    init(edge:Edge, extra:CGFloat) {
        self.edges = [edge]
        self.length = edge.length
        self.extra = extra
    }
    
    init(route:Route, edge:Edge, extra:CGFloat) {
        var edges = route.edges
        edges.append(edge)
        self.edges = edges
        self.length = route.length + edge.length
        self.extra = extra
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
