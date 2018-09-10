//
//  Rider.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

enum RiderState {
    case none
    case assigned
    case riding
    case done
}

// A Rider represents a person who needs to move from one node to another. 
class Rider {
    static let image = UIImage(named: "rider.png")!
    let from:Int
    let to:Int
    var state = RiderState.none
    var hue:CGFloat = 0.0
    var location:CGPoint
    var offset = 0 // visual offset when riding

    init(nodes:[Node]) {
        from = Random.int(nodes.count) 
        to = (from + 1 + Random.int(nodes.count-1)) % nodes.count
        location = nodes[from].location
        assert(to != from)
    }

    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        let node1 = nodes[to]
        ctx.move(to: CGPoint(x: location.x * scale, y: location.y * scale))
        ctx.addLine(to: CGPoint(x: node1.location.x * scale, y: node1.location.y * scale))

        let colorFill = (state == .none) ? UIColor.black : UIColor(hue: hue, saturation: 1.0, brightness: 0.5, alpha: Metrics.riderAlpha)
        let colorStroke = (state == .none) ? UIColor.black : UIColor(hue: hue, saturation: 1.0, brightness: 0.5, alpha: Metrics.riderPathAlpha)
        colorStroke.setStroke()
        colorFill.setFill()
        ctx.setLineWidth(Metrics.riderPathWidth)
        ctx.drawPath(using: .stroke)
        let rc = CGRect(x: location.x * scale + Metrics.riderRadius * (2.5 * CGFloat(offset) - 1), y: location.y * scale - Metrics.riderRadius * 6.0, width: Metrics.riderRadius * 2.0, height: Metrics.riderRadius * 6.0)
        ctx.fillEllipse(in: rc)
        Rider.image.draw(in: rc) // HACK: This code assumes ctx is the current UI Graphics context
    }
}
