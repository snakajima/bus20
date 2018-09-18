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

    override func viewDidLoad() {
        super.viewDidLoad()

        stepperShuttles.value = Double(Metrics.numberOfShuttles)
        stepperCapacity.value = Double(Metrics.shuttleCapacity)
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

    @IBAction func done(_:UIBarButtonItem) {
        self.dismiss(animated: true, completion: nil)
    }
}
