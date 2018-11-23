//
//  MapsTableViewController.swift
//  bus20
//
//  Created by SATOSHI NAKAJIMA on 11/15/18.
//  Copyright © 2018 SATOSHI NAKAJIMA. All rights reserved.
//

import UIKit

class MapsTableViewController: UITableViewController {
    let maps = [
        "map", "map2", "map3", "map5x5", "map5x5a", "bus_stop"
    ]

    override func viewDidLoad() {
        super.viewDidLoad()

        // Uncomment the following line to preserve selection between presentations
        // self.clearsSelectionOnViewWillAppear = false

        // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
        // self.navigationItem.rightBarButtonItem = self.editButtonItem
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        // #warning Incomplete implementation, return the number of sections
        return 2
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        // #warning Incomplete implementation, return the number of rows
        return (section == 0) ? 1 : maps.count
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "map", for: indexPath)
        if indexPath.section == 1 {
            cell.textLabel!.text = maps[indexPath.row]
        } else {
            cell.textLabel!.text = "Random"
        }
        return cell
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        var graph:Graph
        if indexPath.section == 0 {
            graph = Graph(w: Metrics.graphWidth, h: Metrics.graphHeight, unit: Metrics.edgeLength)
        } else {
            guard let g = try? Graph(file:maps[indexPath.row]) else {
                return
            }
            graph = g
        }
        self.performSegue(withIdentifier: "Emulator", sender: graph)
    }

    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
        if let emulator = segue.destination as? Emulator,
            let graph = sender as? Graph {
            emulator.graph = graph
        }
    }

}
