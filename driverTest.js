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
var MAX_THRUST = 200;
// Constants
var AU = 1.496e11; // Astronomical Unit in meters
var SECONDS_IN_YEAR = 31536000;
var SECONDS_IN_DAY = 86400;
var initialGene = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var gene = initialGene;
var randomizeGene = function (gene, amount) {
    return gene.map(function (g, i) {
        var newGene = g + Math.random() * amount - amount / 2;
        if (newGene < 0) {
            newGene = 0;
        }
        if (newGene > 1) {
            newGene = 1;
        }
        return newGene;
    });
};
var getThrustProgram = function (gene) {
    // Convert gene to thrust program
    // Each gene is 3 values: time, direction, thrust
    // Time is in years, direction is in degrees, thrust is in newtons
    // The thrust program is a list of genes
    // The thrust program is a list of genes
    var thrustProgram = [];
    for (var i = 0; i < gene.length; i += 3) {
        thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], gene[i + 2] > 0.5 ? MAX_THRUST : 0]);
    }
    return thrustProgram;
};
var sun = { name: 'sun', x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
var earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
var venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
var mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e-12, color: 'red', thrust: 0 };
var jupiter = { name: 'jupiter', x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };
var ceres = { name: 'ceres', x: -2.77 * AU, y: 0, vx: 0, vy: -17900, mass: 9.393e20, color: 'gray', thrust: 0 };
var target = ceres;
var objectiveFunction = function (body, gene) {
    var lastYearsDistance = body.lastYearsDistance ? body.lastYearsDistance : [];
    var lastYearsTargetDistance = body.lastYearDistanceTarget ? body.lastYearDistanceTarget : [];
    var total = 0;
    var min = 100 * AU;
    var max = 0;
    var minTarget = 100 * AU;
    var maxTarget = 0;
    for (var i = 0; i < lastYearsDistance.length; i++) {
        if (lastYearsDistance[i] < min) {
            min = lastYearsDistance[i];
        }
        if (lastYearsDistance[i] > max) {
            max = lastYearsDistance[i];
        }
        total = total + lastYearsDistance[i];
    }
    for (var i = 0; i < lastYearsTargetDistance.length; i++) {
        if (lastYearsTargetDistance[i] < minTarget) {
            minTarget = lastYearsTargetDistance[i];
        }
        if (lastYearsTargetDistance[i] > maxTarget) {
            maxTarget = lastYearsTargetDistance[i];
        }
        total = total + lastYearsTargetDistance[i];
    }
    var totalBoost = 0;
    var totalProgram = 0;
    for (var i = 0; i < gene.length; i = i + 3) {
        totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
        totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
    }
    var minTargetDistance = 0; //minTarget / AU;
    var maxTargetDistance = 0; //maxTarget / AU;
    var minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    var maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    var MAX_TRIP_TIME = 3 * SECONDS_IN_YEAR;
    var MAX_NEWTON_SECONDS = 200 * SECONDS_IN_YEAR;
    var boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    var programDistance = (totalProgram > MAX_TRIP_TIME) ? ((MAX_TRIP_TIME - totalProgram) / (MAX_TRIP_TIME)) : 0;
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance + minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
};
// Create 100 random genes
var genes = [];
for (var i = 0; i < 100; i++) {
    genes.push(randomizeGene(initialGene, 1));
}
var results = [];
var bestRating = 100;
var lastRating = 100;
var step = 1;
var bestResults = [];
var worseCount = 0;
var history = [];
var breed = function (results) {
    results.sort(function (a, b) { return a.distance - b.distance; });
    var rating = results[0].distance;
    history.push(rating);
    // Get the variance of the last 10 ratings around the best rating so far
    if (history.length > 10) {
        history.shift();
    }
    var variance = 0;
    for (var _i = 0, history_1 = history; _i < history_1.length; _i++) {
        var h = history_1[_i];
        variance = variance + Math.abs((h - bestRating) / (bestRating));
    }
    variance = variance / history.length;
    console.log("Variance: ".concat(variance, " "));
    var pctChange = (bestRating - rating) / bestRating;
    if (rating > bestRating) {
        worseCount++;
        if (bestResults.length > 0 && worseCount > 10) {
            results = bestResults;
            console.log("RESETTING TO BEST RESULTS Step: ".concat(step, ", ").concat(bestRating, " "));
            worseCount = 0;
        }
    }
    else {
        worseCount = 0;
    }
    step = bestRating / (Math.abs(variance));
    if (step > 1) {
        step = 1;
    }
    console.log("Step: ".concat(step, ", best: ").concat(bestRating, " rating: ").concat(rating, " "));
    if (rating < bestRating || bestResults.length == 0) {
        bestResults = results;
        bestRating = rating;
    }
    lastRating = rating;
    var newGenes = [];
    for (var i = 0; i < 10; i++) {
        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (var i = 0; i < 10; i++) {
        var gene_1 = results[i].gene;
        if (i == 0)
            console.log("Gene ".concat(i, " distance: ").concat(results[i].distance, " , gene: ").concat(results[i].gene, " "));
        var totalBoost = 0;
        var totalProgram = 0;
        for (var i_1 = 0; i_1 < gene_1.length; i_1 = i_1 + 3) {
            //  console.log(`Gene ${ i }: ${ gene[i] }, ${ gene[i + 1] }, ${ gene[i + 2] } `);
            //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene_1[i_1] * ((gene_1[i_1 + 2] > 0.5) ? MAX_THRUST : 0);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene_1[i_1];
        }
        console.log(" totalBoost: ".concat(totalBoost / SECONDS_IN_YEAR, ", totalProgram: ").concat(totalProgram / SECONDS_IN_YEAR, " "));
        for (var k = 1; k < 6; k++) {
            newGenes.push(randomizeGene(results[i].gene, step));
        }
    }
    return newGenes;
};
// Main simulation loop
for (var i = 0; i < 200; i++) {
    results = [];
    for (var _i = 0, genes_1 = genes; _i < genes_1.length; _i++) {
        var gene_2 = genes_1[_i];
        var thrustProgram = getThrustProgram(gene_2);
        var target_1 = __assign({}, ceres);
        var ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram: thrustProgram };
        var bodies = [ship, __assign({}, sun), __assign({}, mars)];
        (0, orbital_1.simulate)(5 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene: gene_2, distance: objectiveFunction(ship, gene_2) });
    }
    genes = breed(results);
}
