//
//  Edge.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Edge {
    let index0:Int
    let index1:Int
    var length:CGFloat
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
