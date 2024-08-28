import { CelestialBody, simulate } from "./orbital";
const MAX_THRUST = 200;
// Constants
const AU = 1.496e11; // Astronomical Unit in meters
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
type Gene = number[];
const initialGene1: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const initialGene2: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let bestGene1: Gene = initialGene1;
let bestGene2: Gene = initialGene2;

var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;

// Takes any integer
function seed(i: number) {
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
let loops = 200;

seed(20);

const randomizeGene = (gene: Gene, amount: number): Gene => {
    return gene.map(function (g: number, i) {
        let newGene = g + random() * amount - amount / 2;

        if (newGene < 0) {
            newGene = 0;
        }
        if (newGene > 1) {
            newGene = 1;
        }
        return newGene;

    });

}


const getThrustProgram = (gene: Gene) => {
    // Convert gene to thrust program
    // Each gene is 3 values: time, direction, thrust
    // Time is in years, direction is in degrees, thrust is in newtons
    // The thrust program is a list of genes
    // The thrust program is a list of genes
    const thrustProgram = [];

    for (let i = 0; i < gene.length; i += 3) {

        thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], gene[i + 2] > 0.5 ? MAX_THRUST : 0]);
    }
    return thrustProgram;
};

const sun = { name: 'sun', x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
const earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
const venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
const mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e-12, color: 'red', thrust: 0 };
const jupiter = { name: 'jupiter', x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };
let ceres = { name: 'ceres', x: -2.77 * AU, y: 0, vx: 0, vy: -17900, mass: 9.393e20, color: 'gray', thrust: 0 };
let target = ceres;

const objectiveFunction = (body: CelestialBody, gene: Gene) => {
    const lastYearsDistance = body.lastYearsDistance ? body.lastYearsDistance : [];
    const lastYearsTargetDistance = body.lastYearDistanceTarget ? body.lastYearDistanceTarget : [];
    let total = 0;
    let min = 100 * AU;
    let max = 0;
    let minTarget = 100 * AU;
    let maxTarget = 0;
    for (let i = 0; i < lastYearsDistance.length; i++) {
        if (lastYearsDistance[i] < min) {
            min = lastYearsDistance[i];
        }
        if (lastYearsDistance[i] > max) {
            max = lastYearsDistance[i];
        }
        total = total + lastYearsDistance[i];
    }

    let totalBoost = 0;
    let totalProgram = 0

    for (let i = 1; i < gene.length; i = i + 3) {
        totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
        totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
    }


    const minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    const maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    const MAX_TRIP_TIME = 8 * SECONDS_IN_YEAR;
    const MAX_NEWTON_SECONDS = 1000 * SECONDS_IN_YEAR;
    const boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    const programDistance = (totalProgram > MAX_TRIP_TIME) ? ((MAX_TRIP_TIME - totalProgram) / (MAX_TRIP_TIME)) : 0;
    return Math.sqrt(minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
}

const objectiveFunction2 = (body: CelestialBody) => {

    const lastYearsTargetDistance = body.lastYearDistanceTarget ? body.lastYearDistanceTarget : [];

    let minTarget = 100 * AU;
    let maxTarget = 0;

    for (let i = 0; i < lastYearsTargetDistance.length; i++) {
        if (lastYearsTargetDistance[i] < minTarget) {
            minTarget = lastYearsTargetDistance[i];
        }
        if (lastYearsTargetDistance[i] > maxTarget) {
            maxTarget = lastYearsTargetDistance[i];
        }
    }

    const minTargetDistance = minTarget / AU;
    const maxTargetDistance = maxTarget / AU;
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance);
}

// Create 100 random genes
let genes1: Gene[] = [];
for (let i = 0; i < 100; i++) {
    genes1.push(randomizeGene(initialGene1, 1));
}
let genes2: Gene[] = [];
for (let i = 0; i < 100; i++) {
    genes2.push(randomizeGene(initialGene2, 1));
}

type Result = { gene: Gene, distance: number };

type BreedType = { results: Result[], bestRating: number, lastRating: number, step: number, bestResults: Result[], worseCount: number, history: number[] };

const breed = ({ results, bestRating, lastRating, step, bestResults, history, worseCount }: BreedType): { genes: Gene[], parms: BreedType } => {

    results.sort((a, b) => a.distance - b.distance);
    let rating = results[0].distance;
    history.push(rating);
    // Get the variance of the last 10 ratings around the best rating so far
    if (history.length > 10) {
        history.shift();
    }
    let variance = 0;
    for (let h of history) {

        variance = variance + Math.abs((h - bestRating) / (bestRating));
    }

    variance = variance / history.length;
    console.log(`Variance: ${variance} `);

    let pctChange = (bestRating - rating) / bestRating;
    if (rating >= bestRating) {
        worseCount++;

        // if (bestResults.length > 0 && worseCount > 10) {
        //     results = bestResults;
        //     console.log(`RESETTING TO BEST RESULTS Step: ${step}, ${bestRating} `);
        //     worseCount = 0;
        // }


    } else {
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
    } else {

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
    console.log(`Step: ${step}, best: ${bestRating} rating: ${rating} worst: ${worseCount} `);
    const newGenes = [];
    for (let i = 0; i < 10; i++) {

        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (let i = 0; i < 10; i++) {
        const gene = results[i].gene;
        if (i == 0) console.log(`Gene ${i} distance: ${results[i].distance} , gene: ${results[i].gene} `);
        let totalBoost = 0;
        let totalProgram = 0
        for (let i = 1; i < gene.length; i = i + 3) {
            //  console.log(`Gene ${ i }: ${ gene[i] }, ${ gene[i + 1] }, ${ gene[i + 2] } `);



            //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];


        }
        console.log(` totalBoost: ${totalBoost / SECONDS_IN_YEAR}, totalProgram: ${totalProgram / SECONDS_IN_YEAR} `);


        for (let k = 1; k < 6; k++) {

            newGenes.push(randomizeGene(results[i].gene, step));
        }


    }

    return { genes: newGenes, parms: { results, bestRating, lastRating, step, bestResults, worseCount, history } };
}
function zeroThrust(g: number, index: number): number {
    if (index % 3 == 0) {
        return g;
    }
    return 0;
}

let results: Result[] = [];
let parms = { results, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };
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
parms = { results, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };

// Main simulation loop
for (; loops > 0; loops--) {


    console.log(`Best Gene 1: ${bestGene1} `);
    results = [];
    for (let gene of genes2) {
        const thrustProgram = getThrustProgram(gene.map(zeroThrust).concat(bestGene1));

        const ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram };
        let bodies = [ship, { ...sun }, { ...mars }];
        simulate(10 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene, distance: objectiveFunction2(ship) });
        parms.results = results;
    }
    try {
        parms.step = -1;
        const breedResult = breed(parms);
        genes2 = breedResult.genes;
        parms = breedResult.parms;
    } catch (e) {
        console.log(`Resetting simulation`);
        results = [];
        parms = { results, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };
        genes2 = [];
        for (let i = 0; i < 100; i++) {
            genes2.push(randomizeGene(initialGene2, 1));
        }

        console.log(`RESETTING ENTIRE SIMULATION Step: ${parms.step}, ${parms.bestRating} `);
        loops = 200;
    }


}
bestGene2 = parms.bestResults[0].gene;
console.log(`Best Gene 2: ${bestGene2} distance: ${parms.bestResults[0].distance} `);
console.log(`Done ${bestGene2.concat(bestGene1)} `);


