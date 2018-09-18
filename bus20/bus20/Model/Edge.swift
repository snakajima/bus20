//
//  Edge.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

// An Edge represents a road (one directional) from one node to another
struct Edge {
    let from:Int
    let to:Int
    let length:CGFloat
    
    init(from:Int, to:Int, length:CGFloat=1.0) {
        self.from = from
        self.to = to
        self.length = length
    }
    
    // For rendering
    func addPath(ctx:CGContext, graph:Graph, scale:CGFloat) {
        let locationFrom = graph.location(at: from)
        let locationTo = graph.location(at: to)
        ctx.move(to: CGPoint(x: locationFrom.x * scale, y: locationFrom.y * scale))
        ctx.addLine(to: CGPoint(x: locationTo.x * scale, y: locationTo.y * scale))
    }
}
