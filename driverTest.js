"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var orbital_1 = require("./orbital");
var MAX_THRUST = 100000;
// Constants
var AU = 1.496e11; // Astronomical Unit in meters
var SECONDS_IN_YEAR = 31536000;
var SECONDS_IN_DAY = 86400;
var initialGene = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var gene = initialGene;
var randomizeGene = function (gene, amount) {
    if (amount > 200) {
        amount = 200;
    }
    if (Math.random() < 0.05) {
        amount = amount * 10;
    }
    return gene.map(function (g, i) {
        if (i % 3 == 0) {
            var change = Math.random() * SECONDS_IN_DAY * amount - SECONDS_IN_DAY * amount / 2;
            return g + change > 0 ? g + change : 0;
        }
        else if ((i % 3) == 1) {
            var change = Math.random() * amount - amount / 2;
            return (g + change) % 360;
        }
        else if ((i % 3) == 2) {
            // return MAX_THRUST;
            var change = Math.random() * MAX_THRUST / 400 * amount - MAX_THRUST / 400 * amount / 2;
            return g + change > MAX_THRUST ? MAX_THRUST : g + change < 0 ? 0 : g + change;
        }
    });
};
var getThrustProgram = function (gene) {
    return [[gene[0], gene[1], gene[2]], [gene[3], gene[4], gene[5]], [gene[6], gene[7], gene[8]], [gene[9], gene[10], gene[11]], [gene[12], gene[13], gene[14]]];
};
var sun = { name: 'sun', x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
var earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
var venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
var mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e23, color: 'red', thrust: 0 };
var jupiter = { name: 'jupiter', x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };
var objectiveFunction = function (body, gene) {
    var lastYearsDistance = body.lastYearsDistance ? body.lastYearsDistance : [];
    var total = 0;
    var min = 100 * AU;
    var max = 0;
    for (var i = 0; i < lastYearsDistance.length; i++) {
        if (lastYearsDistance[i] < min) {
            min = lastYearsDistance[i];
        }
        if (lastYearsDistance[i] > max) {
            max = lastYearsDistance[i];
        }
        total = total + lastYearsDistance[i];
    }
    var totalBoost = 0;
    var totalProgram = 0;
    //Every other third position is a boost
    for (var i = 0; i < gene.length; i = i + 3) {
        //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
        totalBoost = totalBoost + gene[i] * gene[i + 2];
        totalProgram = totalProgram + gene[i];
    }
    //console.log(` totalBoost: ${totalBoost / SECONDS_IN_YEAR}, totalProgram: ${totalProgram}`);
    var avg = total / lastYearsDistance.length;
    var minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    var maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    var MAX_NEWTON_SECONDS = 1000000 * SECONDS_IN_YEAR;
    var boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    var programDistance = totalProgram > SECONDS_IN_YEAR * 10 ? (totalProgram - SECONDS_IN_YEAR * 10) / (SECONDS_IN_YEAR * 10) : 0;
    //console.log(`programDistance: ${totalProgram / SECONDS_IN_YEAR}`);
    // console.log(`minDistance: ${minDistance}, maxDistance: ${maxDistance}`);
    return Math.sqrt(minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
    // const v = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    // return Math.abs(v - 24130);
};
// Create 100 random genes
var genes = [];
for (var i = 0; i < 100; i++) {
    genes.push(randomizeGene(initialGene, 1000));
}
// Function that calculates the distance in AU from sun
var distanceFromSun = function (body) {
    return Math.sqrt(body.x * body.x + body.y * body.y);
};
var results = [];
var lastBest = 100;
var step = 100;
var lastResults = [];
var breed = function (results) {
    // if (results[0].distance < 0.2) {
    //     step = 10;
    // }
    // if (results[0].distance < 0.01) {
    //     step = 1;
    // }
    // if (results[0].distance < 0.001) {
    //     step = 0.1;
    // }
    // if (results[0].distance < 0.0001) {
    //     step = 0.01;
    // }
    // Get the best 10 genes and add 10 random mutations
    // newGenes.push(results[0].gene);
    // Best score so far
    var best = results[0].distance;
    if (lastBest) {
        // 0.08
        // 0.07
        console.log("Best: ".concat(best, ", lastBest: ").concat(lastBest, ", diff: ").concat(lastBest - best));
        var pctChange = (lastBest - best) / lastBest;
        if (pctChange < 0) {
            //Getting worse
            var diff = Math.abs(pctChange);
            if (diff > 1) {
                step = step / 2;
            }
            else if (diff > 0.5) {
                step = step - step / 4;
            }
            else if (diff > 0.1) {
                step = step - step / 8;
            }
            //Reset to previous results
            results = lastResults;
            console.log("RESETTING TO PREVIOUS RESULTS Step: ".concat(step, ", pctChange: ").concat(pctChange));
            // If we got worse, we should try again with the best genes from last passs
        }
        else if (pctChange < 0.01) {
            //Getting better too slowly
            step = step * 2;
        }
        console.log("Step: ".concat(step, ", pctChange: ").concat(pctChange));
        lastBest = best;
    }
    lastResults = results;
    results.sort(function (a, b) { return a.distance - b.distance; });
    var newGenes = [];
    for (var i = 0; i < 10; i++) {
        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (var i = 0; i < 10; i++) {
        console.log("Gene ".concat(i, " distance: ").concat(results[i].distance, " , gene: ").concat(results[i].gene));
        for (var k = 1; k < 6; k++) {
            newGenes.push(randomizeGene(results[i].gene, step));
        }
    }
    //Create 100 genes by mixing two random genes
    // for (let i = 0; i < 40; i++) {
    //     const gene1 = results[Math.floor(Math.random() * 10)].gene;
    //     const gene2 = results[Math.floor(Math.random() * 10)].gene;
    //     const newGene = [];
    //     for (let j = 0; j < gene1.length; j++) {
    //         newGene.push(Math.random() > 0.5 ? gene1[j] : gene2[j]);
    //     }
    //     newGenes.push(randomizeGene(newGene, step / 5));
    // }
    return newGenes;
};
// Main simulation loop
for (var i = 0; i < 200; i++) {
    results = [];
    for (var _i = 0, genes_1 = genes; _i < genes_1.length; _i++) {
        var gene_1 = genes_1[_i];
        var thrustProgram = getThrustProgram(gene_1);
        var ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -30000, mass: 1e6, color: 'white', thrust: 0, thrustProgram: thrustProgram };
        var bodies = [ship, __assign({}, sun), __assign({}, mars)];
        (0, orbital_1.simulate)(1.5 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene: gene_1, distance: objectiveFunction(ship, gene_1) });
    }
    genes = breed(results);
}
