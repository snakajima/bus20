//
//  Node.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

// A Node represents a location where shuttles can pick up or drop riders
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
    
    func distance(to:Node) -> CGFloat {
        let dx = to.x - self.x
        let dy = to.y - self.y
        return sqrt(dx * dx + dy * dy)
    }
    
    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let rc = CGRect(x: x * scale - 2, y: y * scale - 2, width: 4, height: 4)
        ctx.fillEllipse(in: rc)
        
        ctx.beginPath()
        for edge in edges {
            edge.addPath(ctx: ctx, nodes: nodes, scale: scale)
        }
        ctx.closePath()
        ctx.drawPath(using: .stroke)
    }
}

