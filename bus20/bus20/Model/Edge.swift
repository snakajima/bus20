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
    var length:CGFloat
    
    init(from:Int, to:Int, length:CGFloat=1.0) {
        self.from = from
        self.to = to
        self.length = length
    }
    
    // For rendering
    func addPath(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node0 = nodes[from]
        let node1 = nodes[to]
        ctx.move(to: CGPoint(x: node0.location.x * scale, y: node0.location.y * scale))
        ctx.addLine(to: CGPoint(x: node1.location.x * scale, y: node1.location.y * scale))
    }
}
