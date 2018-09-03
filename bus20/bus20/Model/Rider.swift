//
//  Rider.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

// A Rider represents a person who needs to move from one node to another. 
class Rider {
    static let image = UIImage(named: "rider.png")!.cgImage!
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
    var offset = 0 // visual offset when riding

    init(nodes:[Node]) {
        from = Random.int(nodes.count) 
        to = (from + 1 + Random.int(nodes.count-1)) % nodes.count
        location = CGPoint(x:nodes[from].x, y:nodes[from].y)
        assert(to != from)
    }

    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node1 = nodes[to]
        ctx.move(to: CGPoint(x: location.x * scale, y: location.y * scale))
        ctx.addLine(to: CGPoint(x: node1.x * scale, y: node1.y * scale))

        let colorFill = (state == .none) ? UIColor.black : UIColor(hue: hue, saturation: 1.0, brightness: 0.5, alpha: Metrics.riderAlpha)
        let colorStroke = (state == .none) ? UIColor.black : UIColor(hue: hue, saturation: 1.0, brightness: 0.5, alpha: Metrics.riderPathAlpha)
        colorStroke.setStroke()
        colorFill.setFill()
        ctx.setLineWidth(Metrics.riderPathWidth)
        ctx.drawPath(using: .stroke)
        let rc = CGRect(x: location.x * scale + Metrics.riderRadius * (2.5 * CGFloat(offset) - 1), y: location.y * scale - Metrics.riderRadius * 6.0, width: Metrics.riderRadius * 2.0, height: Metrics.riderRadius * 6.0)
        ctx.fillEllipse(in: rc)
        ctx.draw(Rider.image, in: rc)
    }
}
