//
//  Route.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import CoreGraphics

// A Route represents a section of trip from one node to another consisting of connected edges.
struct Route {
    let edges:[Edge]
    let length:CGFloat
    let extra:CGFloat // used only when finding a shortest route
    var pickups = Set<Int>() // identifiers of riders to be picked up 
    var from:Int { return edges.first!.from }
    var to:Int { return edges.last!.to }

    init(edges:[Edge], extra:CGFloat = 0) {
        self.edges = edges
        self.length = edges.reduce(0) { $0 + $1.length }
        self.extra = extra
    }

    func render(ctx:CGContext, nodes:[Node], scale:CGFloat) {
        guard let first = edges.first else {
            return
        }
        let node0 = nodes[first.from]
        ctx.move(to: CGPoint(x: node0.location.x * scale, y: node0.location.y * scale))
        for edge in edges {
            let node = nodes[edge.to]
            ctx.addLine(to: CGPoint(x: node.location.x * scale, y: node.location.y * scale))
        }
        ctx.drawPath(using: .stroke)
    }
}

extension Route: CustomStringConvertible {
    var description: String {
        var array = edges.map { (edge) -> Int in
            return edge.from
        }
        array.append(self.to)
        return pickups.description + ":" + array.description
    }
}
