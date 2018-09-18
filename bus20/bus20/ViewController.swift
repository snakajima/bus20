//
//  ViewController.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    struct ScheduledRider {
        let rider:Rider
        let rideTime:CGFloat
        init(graph:Graph, limit:CGFloat) {
            rider = Rider(graph:graph)
            rideTime = CGFloat(Random.float(Double(limit)))
        }
    }
    
    @IBOutlet var viewMain:UIView!
    let graph = Graph(w: 10, h: 10, unit: 1.0)
    var routeView:UIImageView!
    var scale = CGFloat(1.0)
    var shuttles = [Shuttle]()
    var start = Date()
    var riders = [Rider]()
    var speedMultiple = Metrics.speedMultiple
    var fTesting = false
    var scheduled = [ScheduledRider]()
    
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
        
        Random.seed(0)
        start(count: Metrics.numberOfShuttles)
    }
    
    func start(count:Int) {
        shuttles = [Shuttle]()
        start = Date()
        riders = [Rider]()
        for i in 0..<count {
            shuttles.append(Shuttle(hue: 1.0/CGFloat(count) * CGFloat(i), index:i*10+i, graph:graph))
        }
        update()
    }
    
    func update() {
        let time = CGFloat(Date().timeIntervalSince(start)) * speedMultiple
        
        while let rider = scheduled.first, rider.rideTime < time {
            assign(rider: rider.rider)
            scheduled.removeFirst()
        }
        
        UIGraphicsBeginImageContextWithOptions(view.frame.size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        let ctx = UIGraphicsGetCurrentContext()!

        shuttles.forEach() {
            $0.update(graph:graph, time:time)
            $0.render(ctx: ctx, graph: graph, scale: scale, time:time)
        }
        
        riders.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: scale)
        }
        
        routeView.image = UIGraphicsGetImageFromCurrentImageContext()!
        
        riders = riders.filter {
            $0.state != .done
        }

        DispatchQueue.main.async {
            self.update()
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func add(_ sender:UIBarButtonItem) {
        if fTesting {
            fTesting = false
            speedMultiple = Metrics.speedMultiple
            Random.seed(0)
            Rider.resetId()
            start(count: Metrics.numberOfShuttles)
        }
        addRider()
    }
    
    func addRider() {
        let rider = Rider(graph:graph)
        assign(rider: rider)
    }
    
    @IBAction func test(_ sender:UIBarButtonItem) {
        fTesting = true
        speedMultiple = 30.0
        Random.nextSeed() // 4, 40, 110
        print("Seed=", Random.seed)
        
        start(count: 1)
        addRider()
        addRider()
        addRider()
        addRider()
        addRider()
        addRider()
        let frame = view.frame
        UIGraphicsBeginImageContextWithOptions(frame.size, true, 0.0)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        graph.render(ctx:ctx, frame: frame, scale:scale)
        shuttles.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: scale, time:0)
        }
        
        riders.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: scale)
        }
        let image = UIGraphicsGetImageFromCurrentImageContext()!
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let path = documents[0].appendingPathComponent("bus20.png")
        let data = UIImagePNGRepresentation(image)!
        try! data.write(to: path)
        print(path)
        
        print(shuttles[0])
    }
    
    @IBAction func emulate(_ sender:UIBarButtonItem) {
        print("emulate:to be implemented")
        Rider.resetId()
        Random.seed(0)
        scheduled = Array(0..<50).map({ (_) -> ScheduledRider in
            return ScheduledRider(graph:graph, limit:60.0)
        }).sorted { $0.rideTime < $1.rideTime }
        
        start(count: Metrics.numberOfShuttles)
        /*
        scheduled.forEach {
            print($0.rideTime)
            riders.append($0.rider)
            assign(rider: $0.rider)
        }
        */
    }
    
    func assign(rider:Rider) {
        riders.append(rider)
        let bestPlan = Shuttle.bestPlan(shuttles: shuttles, graph: graph, rider: rider)
        print("\nVC: bestPlan:", bestPlan.cost)
        bestPlan.shuttle.adapt(routes:bestPlan.routes, rider:rider)
        
        // Debug only
        bestPlan.shuttle.debugDump()
    }
}

