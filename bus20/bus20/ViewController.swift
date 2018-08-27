//
//  ViewController.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    let graph = Graph(w: 10, h: 10, unit: 1.0)
    var routeView:UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        let frame = view.frame
        let mapView = UIImageView(frame: frame)
        let bounds = graph.bounds
        let scale = min(frame.size.width / bounds.size.width,
                        frame.size.height / bounds.size.height)
        mapView.image = graph.render(frame: frame, scale:scale)
        view.addSubview(mapView)

        routeView = UIImageView(frame:frame)
        view.addSubview(routeView)
        
        UIGraphicsBeginImageContextWithOptions(frame.size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        let ctx = UIGraphicsGetCurrentContext()!
        ctx.setLineWidth(1.0)
        UIColor.red.setFill()
        UIColor.red.setStroke()
        
        for node in graph.nodes {
            node.render(ctx:ctx, graph:graph, scale:scale)
        }
        routeView.image = UIGraphicsGetImageFromCurrentImageContext()!

    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}

