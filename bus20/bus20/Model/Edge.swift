//
//  Edge.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Edge {
    let from:Int
    let index1:Int
    var length:CGFloat
    init(from:Int, index1:Int, length:CGFloat=1.0) {
        self.from = from
        self.index1 = index1
        self.length = length
    }
    
    func addPath(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node0 = nodes[from]
        let node1 = nodes[index1]
        ctx.move(to: CGPoint(x: node0.x * scale, y: node0.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))
    }
}
