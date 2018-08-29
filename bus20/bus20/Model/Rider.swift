//
//  Rider.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class Rider {
    let from:Int
    let to:Int
    init(graph:Graph) {
        from = Int(arc4random()) % graph.nodes.count
        to = (from + Int(arc4random()) % (graph.nodes.count-1)) % graph.nodes.count
    }

    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node0 = nodes[from]
        let node1 = nodes[to]
        ctx.move(to: CGPoint(x: node0.x * scale, y: node0.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))

        UIColor.black.setStroke()
        UIColor.black.setFill()
        ctx.drawPath(using: .stroke)
        let rc = CGRect(x: node1.x * scale - 3.0, y: node1.y * scale - 3.0, width: 6.0, height: 6.0)
        ctx.fillEllipse(in: rc)
    }
}
