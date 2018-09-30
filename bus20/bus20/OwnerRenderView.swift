//
//  OwnerRenderView.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 9/29/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

protocol OwnerRenderViewDelegate:NSObjectProtocol {
    func draw(_ rect:CGRect)
}
class OwnerRenderView: UIView {
    weak var delegate:OwnerRenderViewDelegate?
    required init?(coder:NSCoder) {
        super.init(coder: coder)
    }
    override init(frame:CGRect) {
        super.init(frame: frame)
    }
    override func draw(_ rect: CGRect) {
        delegate?.draw(rect)
    }
}
