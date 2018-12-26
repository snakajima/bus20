//
//  Emulator.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 8/27/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit
import MapKit

class Emulator: UIViewController {
    struct ScheduledRider {
        let rider:Rider
        let rideTime:CGFloat
        init(graph:Graph, limit:CGFloat) {
            rider = Rider(graph:graph)
            rideTime = CGFloat(Random.float(Double(limit)))
        }
    }
    
    @IBOutlet var viewMain:UIView!
    @IBOutlet var label:UILabel!
    var graph:Graph! // Must be set by the caller
    //let graph = try! Graph()
    let labelTime = UILabel(frame: .zero) // to render text
    var graphView:UIImageView!
    var mapView:MKMapView!
    var routeView:OwnerRenderView!
    var scale = CGFloat(1.0)
    var scaleX = CGFloat(1.0)
    var scaleY = CGFloat(1.0)
    var offset = CGPoint.zero
    var shuttles = [Shuttle]()
    var start = Date()
    var riders = [Rider]()
    var speedMultiple = Metrics.speedMultiple
    var scheduled = [ScheduledRider]()
    var done = false
    var totalCount:CGFloat = 0
    var busyCount:CGFloat = 0
    var totalOccupancy:CGFloat = 0
    var fTesting = false
    var timeUpdated = CGFloat(0)
    
    func renderMap() {
        let frame = viewMain.bounds
        UIGraphicsBeginImageContextWithOptions(frame.size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        let span = MKCoordinateSpan(latitudeDelta: Double(frame.size.height/scale), longitudeDelta: Double(frame.size.width/scale))
        let center = CLLocationCoordinate2D(latitude: Double(offset.y/scale) - span.latitudeDelta/2.0, longitude: -Double(offset.x/scale) + span.longitudeDelta/2.0)
        let region = MKCoordinateRegion(center: center, span: span)
        mapView.region = mapView.regionThatFits(region)
        let spanFits = mapView.region.span
        scaleY = frame.size.height / CGFloat(spanFits.latitudeDelta)
        scaleX = frame.size.width / CGFloat(spanFits.longitudeDelta)
        print("scales", scale, scaleX, scaleY)

        let centerFits = CLLocationCoordinate2D(latitude: Double(offset.y/scale) - spanFits.latitudeDelta/2.0, longitude: -Double(offset.x/scale) + spanFits.longitudeDelta/2.0)
        mapView.region = mapView.regionThatFits(MKCoordinateRegion(center: centerFits, span: spanFits))

        let ctx = UIGraphicsGetCurrentContext()!
        ctx.clear(frame)
        ctx.translateBy(x: offset.x * scaleX / scale,
                        y: offset.y * scaleY / scale)
        graph.render(ctx:ctx, frame: frame, scale:CGSize(width: scaleX, height: scaleY))
        //print("EM:graph=", graph.json);
        graphView.image = UIGraphicsGetImageFromCurrentImageContext()
        
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let frame = viewMain.bounds
        mapView = MKMapView(frame: frame)
        viewMain.addSubview(mapView)
        
        graphView = UIImageView(frame: frame)
        viewMain.addSubview(graphView)

        routeView = OwnerRenderView(frame:frame)
        routeView.delegate = self
        routeView.isOpaque = false
        viewMain.addSubview(routeView)

        Random.seed(0)
        start(count: Metrics.numberOfShuttles)
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let frame = viewMain.bounds
        mapView.frame = frame
        graphView.frame = frame
        routeView.frame = frame
        
        // If this is the very first call, initialize scale and offset.
        if graphView.image == nil {
            let bounds = graph.boundingBox
            scale = min(frame.size.width / bounds.width,
                        frame.size.height / bounds.height)
            offset = CGPoint(x: -bounds.origin.x * scale, y: -bounds.origin.y * scale)
        }
        renderMap()
    }
    
    func start(count:Int, fTesting:Bool = false) {
        speedMultiple = Metrics.speedMultiple
        Rider.resetId()
        if !self.fTesting || !fTesting {
            label.text = ""
        }
        totalCount = 0
        busyCount = 0
        totalOccupancy = 0
        start = Date()
        timeUpdated = 0.0
        riders = [Rider]()
        scheduled = [ScheduledRider]()
        if self.fTesting && shuttles.count == count && done {
            shuttles.forEach { $0.reset() }
        } else {
            shuttles = (0..<count).map { Shuttle(hue: 1.0/CGFloat(count) * CGFloat($0), graph:graph) }
        }
        self.fTesting = fTesting
        done = false
        update()
    }
    
    func update() {
        let time = CGFloat(Date().timeIntervalSince(start)) * speedMultiple
        
        while let rider = scheduled.first, rider.rideTime < time {
            scheduled.removeFirst()
            rider.rider.startTime = time
            assign(rider: rider.rider, time:time)
        }
        
        shuttles.forEach() {
            $0.update(graph:graph, time:time)
            
            // Exclude the beginning and tail end from the Shuttle stats
            if (time > Metrics.playDuration / 3 && time < Metrics.playDuration) || fTesting {
                totalCount += 1
                totalOccupancy += $0.ocupancy
                if $0.isBusy { busyCount += 1 }
            }
        }
        
        let activeRiders = riders.filter({ $0.state != .done })
        if done == false && scheduled.count == 0 && riders.count > 0 && activeRiders.count == 0 {
            done = true
            postProcess()
        }
        timeUpdated = time
        render()
    }
    
    func render() {
        routeView.setNeedsDisplay()
    }
    
    func postProcess() {
        let count = CGFloat(riders.count)
        let wait = riders.reduce(CGFloat(0.0)) { $0 + $1.pickupTime - $1.startTime }
        let ride = riders.reduce(CGFloat(0.0)) { $0 + $1.dropTime - $1.pickupTime }
        let extra = riders.reduce(CGFloat(0.0)) { $0 + $1.dropTime - $1.pickupTime - $1.route.length }
        print(String(format: "w:%.1f, r:%.1f, e:%.1f, u:%.1f%%, o:%.1f%%",
                     wait/count, ride/count, extra/count,
                     busyCount * 100 / totalCount, totalOccupancy * 100 / totalCount ))
        label.text = String(format: "Number of Shuttles: %d\nShuttle Capacity: %d\nPassengers/Hour: %d\nAvarage Wait: %.1f min\nAvarage Ride: %.1f min\nAverage Detour: %.1f min\nShuttle Utilization: %.1f%%\nOccupancy Rate: %.1f%%",
                            Metrics.numberOfShuttles, Metrics.shuttleCapacity, Metrics.riderCount,
                                wait/count, ride/count, extra/count,
                                busyCount * 100 / totalCount, totalOccupancy * 100 / totalCount )
        
        if fTesting {
            test(nil)
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func add(_ sender:UIBarButtonItem) {
        addRider(time:timeUpdated)
    }
    
    func addRider(time:CGFloat) {
        let rider = Rider(graph:graph)
        assign(rider: rider, time:time)
    }
    
    @IBAction func test(_ sender:UIBarButtonItem?) {
        if let _ = sender {
            Random.seed(0)
        } else {
            Random.nextSeed() // 4, 40, 110
        }
        print("Seed=", Random.seed)
        
        start(count: 1, fTesting:true)
        for _ in 0..<6 {
            addRider(time:timeUpdated)
        }
        let frame = view.frame
        UIGraphicsBeginImageContextWithOptions(frame.size, true, 0.0)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        graph.render(ctx:ctx, frame: frame, scale:CGSize(width: scaleX, height: scaleY))
        shuttles.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: CGSize(width: scaleX, height: scaleY), time:0)
        }
        
        riders.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: CGSize(width: scaleX, height: scaleY))
        }
        let image = UIGraphicsGetImageFromCurrentImageContext()!
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let path = documents[0].appendingPathComponent("bus20.png")
        let data = image.pngData()!
        try! data.write(to: path)
        print(path)
        
        print(shuttles[0])
    }
    
    @IBAction func emulate(_ sender:UIBarButtonItem) {
        Random.seed(0)
        
        start(count: Metrics.numberOfShuttles)
        scheduled = Array(0..<Metrics.riderCount * Int(Metrics.playDuration / 60)).map({ (_) -> ScheduledRider in
            return ScheduledRider(graph:graph, limit:Metrics.playDuration)
        }).sorted { $0.rideTime < $1.rideTime }
        /*
        scheduled.forEach {
            print($0.rideTime)
            riders.append($0.rider)
            assign(rider: $0.rider)
        }
        */
    }
    
    func assign(rider:Rider, time:CGFloat) {
        riders.append(rider)
        let before = Date()
        let bestPlan = Shuttle.bestPlan(shuttles: shuttles, graph: graph, rider: rider, time:time)
        let delta = Date().timeIntervalSince(before)
        let maxDepth = shuttles.reduce(0) { max($0, $1.depth) }
        print(String(format:"bestPlan:%.0f, time:%.4f, riders:%d, depth:%d", bestPlan.cost, delta, riders.count, maxDepth))
        bestPlan.shuttle.adapt(routes:bestPlan.routes, rider:rider)
        if delta > 0.5 {
            done = true
            scheduled.removeAll()
            label.text = "This setting is too complext for this device to process."
        }
        
        // Debug only
        //bestPlan.shuttle.debugDump()
    }
    
}

extension Emulator : OwnerRenderViewDelegate {
    func draw(_ rect:CGRect) {
        //let frame = viewMain.bounds
        let ctx = UIGraphicsGetCurrentContext()!
        ctx.clear(rect)
        labelTime.text = String(format: "%2d:%02d", Int(timeUpdated / 60), Int(timeUpdated) % 60)
        labelTime.drawText(in: CGRect(x: 2, y: 2, width: 100, height: 20))
        //ctx.translateBy(x: offset.x, y: offset.y)
        ctx.translateBy(x: offset.x * scaleX / scale,
                        y: offset.y * scaleY / scale)
        //ctx.translateBy(x: (offset.x - frame.size.width/2) * scaleX / scale + frame.size.width/2,
                        //y: (offset.y - frame.size.height/2) * scaleY / scale + frame.size.height/2)
        shuttles.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: CGSize(width: scaleX, height: scaleY), time:timeUpdated)
        }
        let activeRiders = riders.filter({ $0.state != .done })
        activeRiders.forEach() {
            $0.render(ctx: ctx, graph: graph, scale: CGSize(width: scaleX, height: scaleY))
        }
        DispatchQueue.main.async {
            self.update()
        }
    }
    
    @IBAction func pan(_ sender:UIPanGestureRecognizer) {
        let move = sender.translation(in: view)
        switch(sender.state) {
        case .began, .changed:
            graphView.transform = CGAffineTransform(translationX: move.x, y: move.y)
            routeView.transform = graphView.transform
            mapView.transform = graphView.transform
        case .ended:
            offset.x += move.x
            offset.y += move.y
            renderMap()
            graphView.transform = .identity
            routeView.transform = .identity
            mapView.transform = .identity
        default:
            graphView.transform = .identity
            routeView.transform = .identity
            mapView.transform = .identity
        }
    }
    
    @IBAction func pinch(_ sender:UIPinchGestureRecognizer) {
        switch(sender.state) {
        case .began, .changed:
            graphView.transform = CGAffineTransform(scaleX: sender.scale, y: sender.scale)
            routeView.transform = graphView.transform
            mapView.transform = graphView.transform
        case .ended:
            let size = viewMain.bounds.size
            scale *= sender.scale
            offset.x = offset.x * sender.scale + (size.width - size.width * sender.scale) / 2.0
            offset.y = offset.y * sender.scale + (size.height - size.height * sender.scale) / 2.0
            renderMap()
            graphView.transform = .identity
            routeView.transform = .identity
            mapView.transform = .identity
        default:
            graphView.transform = .identity
            routeView.transform = .identity
            mapView.transform = .identity
        }
    }
}

