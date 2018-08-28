//
//  Rider.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Rider {
    let index0:Int
    let index1:Int
    init(graph:Graph) {
        index0 = Int(arc4random()) % graph.nodes.count
        index1 = (index0 + Int(arc4random()) % (graph.nodes.count-1)) % graph.nodes.count
    }

    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node0 = nodes[index0]
        let node1 = nodes[index1]
        ctx.move(to: CGPoint(x: node0.x * scale, y: node0.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))

        UIColor.black.setStroke()
        UIColor.black.setFill()
        ctx.drawPath(using: .stroke)
        let rc = CGRect(x: node1.x * scale - 3.0, y: node1.y * scale - 3.0, width: 6.0, height: 6.0)
        ctx.fillEllipse(in: rc)
    }
}
