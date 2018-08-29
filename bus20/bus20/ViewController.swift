//
//  ViewController.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    @IBOutlet var viewMain:UIView!
    let graph = Graph(w: 10, h: 10, unit: 1.0)
    var routeView:UIImageView!
    var scale = CGFloat(1.0)
    var shuttles = [Shuttle]()
    let start = Date()
    var riders = [Rider]()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        let frame = view.frame
        let mapView = UIImageView(frame: frame)
        scale = min(frame.size.width / 11.0,
                        frame.size.height / 11.0)
        UIGraphicsBeginImageContextWithOptions(frame.size, true, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        let ctx = UIGraphicsGetCurrentContext()!
        graph.render(ctx:ctx, frame: frame, scale:scale)
        mapView.image = UIGraphicsGetImageFromCurrentImageContext()

        viewMain.addSubview(mapView)

        routeView = UIImageView(frame:frame)
        viewMain.addSubview(routeView)
        
        for i in 0..<8 {
            shuttles.append(Shuttle(hue: 0.125 * CGFloat(i), index:i*10+i, graph:graph))
        }

        update()
    }
    
    func update() {
        let time = CGFloat(Date().timeIntervalSince(start)) * 3.0
        UIGraphicsBeginImageContextWithOptions(view.frame.size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        let ctx = UIGraphicsGetCurrentContext()!

        for shuttle in shuttles {
            shuttle.render(ctx: ctx, graph: graph, scale: scale, time:time)
        }
        
        ctx.setLineWidth(1.0)
        for rider in riders {
            rider.render(ctx: ctx, nodes: graph.nodes, scale: scale)
        }
        
        routeView.image = UIGraphicsGetImageFromCurrentImageContext()!

        DispatchQueue.main.async {
            self.update()
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func add(_ sender:UIBarButtonItem) {
        print("add")
        let rider = Rider(graph:graph)
        riders.append(rider)
        assign(rider: rider)
    }
    
    func assign(rider:Rider) {
        let scores = shuttles.map { (shuttle) -> CGFloat in
            let index = shuttle.edge.from
            return graph.route(from: index, to: rider.from).length
        }
        print(scores)
    }
}

