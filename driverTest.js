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
var initialGene1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var initialGene2 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var bestGene1 = initialGene1;
var bestGene2 = initialGene2;
var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;
// Takes any integer
function seed(i) {
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
}
// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like random().
function random() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
}
var loops = 200;
seed(20);
var randomizeGene = function (gene, amount) {
    return gene.map(function (g, i) {
        var newGene = g + random() * amount - amount / 2;
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
    var totalBoost = 0;
    var totalProgram = 0;
    for (var i = 1; i < gene.length; i = i + 3) {
        totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
        totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
    }
    var minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    var maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    var MAX_TRIP_TIME = 8 * SECONDS_IN_YEAR;
    var MAX_NEWTON_SECONDS = 1000 * SECONDS_IN_YEAR;
    var boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    var programDistance = (totalProgram > MAX_TRIP_TIME) ? ((MAX_TRIP_TIME - totalProgram) / (MAX_TRIP_TIME)) : 0;
    return Math.sqrt(minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
};
var objectiveFunction2 = function (body) {
    var lastYearsTargetDistance = body.lastYearDistanceTarget ? body.lastYearDistanceTarget : [];
    var minTarget = 100 * AU;
    var maxTarget = 0;
    for (var i = 0; i < lastYearsTargetDistance.length; i++) {
        if (lastYearsTargetDistance[i] < minTarget) {
            minTarget = lastYearsTargetDistance[i];
        }
        if (lastYearsTargetDistance[i] > maxTarget) {
            maxTarget = lastYearsTargetDistance[i];
        }
    }
    var minTargetDistance = minTarget / AU;
    var maxTargetDistance = maxTarget / AU;
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance);
};
// Create 100 random genes
var genes1 = [];
for (var i = 0; i < 100; i++) {
    genes1.push(randomizeGene(initialGene1, 1));
}
var genes2 = [];
for (var i = 0; i < 100; i++) {
    genes2.push(randomizeGene(initialGene2, 1));
}
var breed = function (_a) {
    var results = _a.results, bestRating = _a.bestRating, lastRating = _a.lastRating, step = _a.step, bestResults = _a.bestResults, history = _a.history, worseCount = _a.worseCount;
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
    if (rating >= bestRating) {
        worseCount++;
        // if (bestResults.length > 0 && worseCount > 10) {
        //     results = bestResults;
        //     console.log(`RESETTING TO BEST RESULTS Step: ${step}, ${bestRating} `);
        //     worseCount = 0;
        // }
    }
    else {
        worseCount = 0;
    }
    if (bestRating < 1e-8) {
        loops = 0;
    }
    if (bestRating > 1e-6 && worseCount > 20) {
        //Entirely reset the simulation
        throw new Error('Resetting simulation');
    }
    if (step === -1) {
        step = bestRating / 100;
    }
    else {
        step = bestRating / (Math.abs(variance));
    }
    if (step > 1) {
        step = 1;
    }
    if (rating < bestRating || bestResults.length == 0) {
        bestResults = results;
        bestRating = rating;
    }
    lastRating = rating;
    console.log("Step: ".concat(step, ", best: ").concat(bestRating, " rating: ").concat(rating, " worst: ").concat(worseCount, " "));
    var newGenes = [];
    for (var i = 0; i < 10; i++) {
        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (var i = 0; i < 10; i++) {
        var gene = results[i].gene;
        if (i == 0)
            console.log("Gene ".concat(i, " distance: ").concat(results[i].distance, " , gene: ").concat(results[i].gene, " "));
        var totalBoost = 0;
        var totalProgram = 0;
        for (var i_1 = 1; i_1 < gene.length; i_1 = i_1 + 3) {
            //  console.log(`Gene ${ i }: ${ gene[i] }, ${ gene[i + 1] }, ${ gene[i + 2] } `);
            //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i_1] * ((gene[i_1 + 2] > 0.5) ? MAX_THRUST : 0);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i_1];
        }
        console.log(" totalBoost: ".concat(totalBoost / SECONDS_IN_YEAR, ", totalProgram: ").concat(totalProgram / SECONDS_IN_YEAR, " "));
        for (var k = 1; k < 6; k++) {
            newGenes.push(randomizeGene(results[i].gene, step));
        }
    }
    return { genes: newGenes, parms: { results: results, bestRating: bestRating, lastRating: lastRating, step: step, bestResults: bestResults, worseCount: worseCount, history: history } };
};
function zeroThrust(g, index) {
    if (index % 3 == 0) {
        return g;
    }
    return 0;
}
var results = [];
var parms = { results: results, bestRating: 100, lastRating: 100, step: 1, bestResults: [], worseCount: 0, history: [] };
// // Main simulation loop
// for (; loops > 0; loops--) {
//     bestGene2 = genes2[0];
//     results = [];
//     for (let gene of genes1) {
//         const thrustProgram = getThrustProgram(gene);
//         const ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram };
//         let bodies = [ship, { ...sun }, { ...mars }];
//         simulate(10 * SECONDS_IN_YEAR, bodies, 3600);
//         results.push({ gene, distance: objectiveFunction(ship, gene) });
//         parms.results = results;
//     }
//     try {
//         const breedResult = breed(parms);
//         genes1 = breedResult.genes;
//         parms = breedResult.parms;
//     } catch (e) {
//         console.log(`Resetting simulation`);
//         results = [];
//         parms = { results, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };
//         genes1 = [];
//         for (let i = 0; i < 100; i++) {
//             genes1.push(randomizeGene(initialGene1, 1));
//         }
//         console.log(`RESETTING ENTIRE SIMULATION Step: ${parms.step}, ${parms.bestRating} `);
//         loops = 200;
//     }
// }
//bestGene1 = parms.bestResults[0].gene;
//console.log(`Best Gene 1: ${bestGene1} distance: ${parms.bestResults[0].distance} `);
bestGene1 = [0.501136452090216, 0.003551658523728714, 0.5185935925429491, 0.05278547524934966, 0.9062280974199522, 0.676461815554625, 0.5750877606555509, 0.4096814894686363, 0.05900537099789856, 0.46938489181323984, 0.8113155965955294, 0.6624485321252126, 0.8113893524724478, 0.01586635563775942, 0.014495427327020615, 0.1576340944627103, 0.9846982918210953, 0.9306115381243135, 0.021146829562971998, 0.0029630841937146263, 0.4708054249335842, 0.00000395867648729266];
loops = 200;
results = [];
parms = { results: results, bestRating: 100, lastRating: 100, step: 1, bestResults: [], worseCount: 0, history: [] };
// Main simulation loop
for (; loops > 0; loops--) {
    console.log("Best Gene 1: ".concat(bestGene1, " "));
    results = [];
    for (var _i = 0, genes2_1 = genes2; _i < genes2_1.length; _i++) {
        var gene = genes2_1[_i];
        var thrustProgram = getThrustProgram(gene.map(zeroThrust).concat(bestGene1));
        var ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram: thrustProgram };
        var bodies = [ship, __assign({}, sun), __assign({}, mars)];
        (0, orbital_1.simulate)(10 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene: gene, distance: objectiveFunction2(ship) });
        parms.results = results;
    }
    try {
        parms.step = -1;
        var breedResult = breed(parms);
        genes2 = breedResult.genes;
        parms = breedResult.parms;
    }
    catch (e) {
        console.log("Resetting simulation");
        results = [];
        parms = { results: results, bestRating: 100, lastRating: 100, step: 1, bestResults: [], worseCount: 0, history: [] };
        genes2 = [];
        for (var i = 0; i < 100; i++) {
            genes2.push(randomizeGene(initialGene2, 1));
        }
        console.log("RESETTING ENTIRE SIMULATION Step: ".concat(parms.step, ", ").concat(parms.bestRating, " "));
        loops = 200;
    }
}
bestGene2 = parms.bestResults[0].gene;
console.log("Best Gene 2: ".concat(bestGene2, " distance: ").concat(parms.bestResults[0].distance, " "));
console.log("Done ".concat(bestGene2.concat(bestGene1), " "));
