//
//  Rider.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class Rider {
    enum NodeState {
        case none
        case assigned
        case riding
        case done
    }
    let from:Int
    let to:Int
    var state = NodeState.none
    var hue:CGFloat = 0.0
    var location:CGPoint

    init(nodes:[Node]) {
        from = Int(arc4random()) % nodes.count
        to = (from + Int(arc4random()) % (nodes.count-1)) % nodes.count
        location = CGPoint(x:nodes[from].x, y:nodes[from].y)
    }

    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node1 = nodes[to]
        ctx.move(to: CGPoint(x: location.x * scale, y: location.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))

        let color = (state == .none) ? UIColor.black : UIColor(hue: hue, saturation: 1.0, brightness: 0.5, alpha: 0.8)
        color.setStroke()
        color.setFill()
        ctx.drawPath(using: .stroke)
        let rc = CGRect(x: node1.x * scale - 3.0, y: node1.y * scale - 3.0, width: 6.0, height: 6.0)
        ctx.fillEllipse(in: rc)
    }
}
