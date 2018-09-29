//
//  PropertyViewController.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 9/18/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class PropertyViewController: UIViewController {
    @IBOutlet var labelShuttles:UILabel!
    @IBOutlet var labelCapacity:UILabel!
    @IBOutlet var stepperShuttles:UIStepper!
    @IBOutlet var stepperCapacity:UIStepper!
    @IBOutlet var segmentRiders:UISegmentedControl!
    @IBOutlet var segmentSpeed:UISegmentedControl!
    let riders = [25, 50, 100, 200]
    let speeds:[CGFloat] = [1, 3, 6, 30]

    override func viewDidLoad() {
        super.viewDidLoad()

        stepperShuttles.value = Double(Metrics.numberOfShuttles)
        stepperCapacity.value = Double(Metrics.shuttleCapacity)
        for i in 0..<riders.count {
            if Metrics.riderCount == riders[i] {
                segmentRiders.selectedSegmentIndex=i
            }
        }
        for i in 0..<speeds.count {
            if Metrics.speedMultiple == speeds[i] {
                segmentSpeed.selectedSegmentIndex=i
            }
        }
        updateLabels()
    }
    
    func updateLabels() {
        labelShuttles.text = String(format: "%d shuttles", Metrics.numberOfShuttles)
        labelCapacity.text = String(format: "%d passenger/shuttle", Metrics.shuttleCapacity)
    }
    
    @IBAction func valueChanged(_ sender:UIStepper) {
        if sender == stepperShuttles {
            Metrics.numberOfShuttles = Int(sender.value)
        } else if sender == stepperCapacity {
            Metrics.shuttleCapacity = Int(sender.value)
        }
        updateLabels()
    }
    
    @IBAction func segmentValueChanged(_ sender:UISegmentedControl) {
        if sender == segmentRiders {
            Metrics.riderCount = riders[sender.selectedSegmentIndex]
        } else if sender == segmentSpeed {
            Metrics.speedMultiple = speeds[sender.selectedSegmentIndex]
        }
    }

    @IBAction func done(_:UIBarButtonItem) {
        self.dismiss(animated: true, completion: nil)
    }
}
