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
var DUTY_CYCLE = 0.1;
var MAX_THRUST = 500;
// Constants
var AU = 1.496e11; // Astronomical Unit in meters
var SECONDS_IN_YEAR = 31536000;
var SECONDS_IN_DAY = 86400;
var initialGene = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var gene = initialGene;
var randomizeGene = function (gene, amount) {
    // if (amount > 0.1) {
    //     amount = 0.1;
    // }
    // if (Math.random() < amount) {
    //     // Add another chromosome every once in awhile
    //     gene = gene.concat([Math.random(), Math.random(), Math.random()]);
    // }
    // if (Math.random() < amount && gene.length > 6) {
    //     // remove a chromosome every once in awhile from a random position
    //     const index = Math.floor(Math.random() * gene.length / 3);
    //     gene.splice(index * 3, 3);
    // }
    // //Splice in a 1 year coast in the middle
    // if (Math.random() < amount / 10) {
    //     const index = Math.floor(Math.random() * gene.length);
    //     gene.splice(index, 0, 1, 0, 0);
    // }
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
        // console.log(`Gene ${i}: ${gene[i]},${gene[i + 1]}, ${gene[i + 2]}, ${gene[i + 3]}`);
        thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], MAX_THRUST * gene[i + 2]]);
    }
    return thrustProgram;
};
var sun = { name: 'sun', x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
var earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
var venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
var mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e23, color: 'red', thrust: 0 };
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
    // console.log(minTarget / AU, maxTarget / AU, minTarget - maxTarget);
    //Every other third position is a boost
    for (var i = 0; i < gene.length; i = i + 4) {
        //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
        totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * (gene[i + 2] > DUTY_CYCLE ? MAX_THRUST : 0);
        totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
    }
    // const distanceFromCeres = Math.sqrt((body.x - target.x) * (body.x - target.x) + (body.y - target.y) * (body.y - target.y));
    // console.log(`Distance from Ceres: ${distanceFromCeres}`);
    var minTargetDistance = 0; //2 * minTarget / AU;
    var maxTargetDistance = 0; // 2 * maxTarget / AU;
    var minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    var maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    // let ceresDistance = 0;//distanceFromCeres > 1e8 ? distanceFromCeres / AU : 0;
    // console.log(`Ceres distance: ${ceresDistance}`); 
    var avg = total / lastYearsDistance.length;
    // console.log(`Min: ${min}, Max: ${max}, MinTarget: ${minTarget}, MaxTarget: ${maxTarget}, Avg: ${avg}, TotalBoost: ${totalBoost / SECONDS_IN_YEAR}, TotalProgram: ${totalProgram / SECONDS_IN_YEAR}`);
    var MAX_NEWTON_SECONDS = 10000 * SECONDS_IN_YEAR;
    var boostDistance = 0; // totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    var programDistance = 0; //(totalProgram > SECONDS_IN_YEAR * 20) ? ((SECONDS_IN_YEAR * 20 - totalProgram) / (SECONDS_IN_YEAR * 20)) : 0;
    // console.log(programDistance);
    //return Math.sqrt(totalProgram / SECONDS_IN_YEAR);
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance + minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
};
// Create 100 random genes
var genes = [];
for (var i = 0; i < 100; i++) {
    genes.push(randomizeGene(initialGene, 1000));
}
var results = [];
var lastBest = 100;
var step = 1;
var lastResults = [];
var breed = function (results) {
    var best = results[0].distance;
    if (lastBest && lastResults.length > 0) {
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
            if (best > 0.1) {
                step = step + step * 100;
            }
            else {
                step = step * 100;
            }
        }
        if (step > 1) {
            step = 1;
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
        var gene_1 = results[i].gene;
        if (i == 0)
            console.log("Gene ".concat(i, " distance: ").concat(results[i].distance, " , gene: ").concat(results[i].gene));
        var totalBoost = 0;
        var totalProgram = 0;
        for (var i_1 = 0; i_1 < gene_1.length; i_1 = i_1 + 3) {
            //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene_1[i_1] * (gene_1[i_1 + 2] * MAX_THRUST);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene_1[i_1];
        }
        console.log(" totalBoost: ".concat(totalBoost / SECONDS_IN_YEAR, ", totalProgram: ").concat(totalProgram / SECONDS_IN_YEAR));
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
        var gene_2 = genes_1[_i];
        var thrustProgram = getThrustProgram(gene_2);
        var target_1 = __assign({}, ceres);
        var ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -20783, mass: 1e6, color: 'white', thrust: 0, thrustProgram: thrustProgram };
        var bodies = [ship, __assign({}, sun), __assign({}, mars)];
        (0, orbital_1.simulate)(12 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene: gene_2, distance: objectiveFunction(ship, gene_2) });
    }
    genes = breed(results);
}
