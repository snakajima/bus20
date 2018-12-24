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

    func render(ctx:CGContext, graph:Graph, scale:CGSize) {
        let locationFrom = graph.location(at: edges[0].from)
        ctx.move(to: CGPoint(x: locationFrom.x * scale.width, y: locationFrom.y * scale.height))
        for edge in edges {
            let locationTo = graph.location(at: edge.to)
            ctx.addLine(to: CGPoint(x: locationTo.x * scale.width, y: locationTo.y * scale.height))
        }
        ctx.drawPath(using: .stroke)
    }
}

extension Route: CustomStringConvertible {
    var description: String {
        return String(format: "%3d->%3d:%@", from, to,
                      pickups.map{String($0)}.joined(separator: ","))
    }
}
