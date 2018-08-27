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

    override func viewDidLoad() {
        super.viewDidLoad()
        let rc = view.frame
        let imageView = UIImageView(frame: rc)
        imageView.image = graph.render(frame: rc)
        view.addSubview(imageView)
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}

