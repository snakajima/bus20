//
//  Shuttle.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

struct Shuttle {
    let hue:CGFloat
    let edge:Edge

    func render(ctx:CGContext, graph:Graph, scale:CGFloat, time:CGFloat) {
        let node0 = graph.nodes[edge.index0]
        let node1 = graph.nodes[edge.index1]
        let x = node0.x + (node1.x - node0.x) * time
        let y = node0.y + (node1.y - node0.y) * time
        let rc = CGRect(x: x * scale - 5, y: y * scale - 5, width: 10, height: 10)
        UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.8).setFill()
        ctx.fillEllipse(in: rc)
    }
}
