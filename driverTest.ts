import { CelestialBody, simulate } from "./orbital";

const MAX_THRUST = 200;
// Constants
const AU = 1.496e11; // Astronomical Unit in meters
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
type Gene = number[];
const initialGene: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const gene = initialGene;

const randomizeGene = (gene: Gene, amount: number): Gene => {
    return gene.map(function (g: number, i) {

        let newGene = g + Math.random() * amount - amount / 2;

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
    for (let i = 0; i < lastYearsTargetDistance.length; i++) {
        if (lastYearsTargetDistance[i] < minTarget) {
            minTarget = lastYearsTargetDistance[i];
        }
        if (lastYearsTargetDistance[i] > maxTarget) {
            maxTarget = lastYearsTargetDistance[i];
        }
        total = total + lastYearsTargetDistance[i];
    }
    let totalBoost = 0;
    let totalProgram = 0

    for (let i = 0; i < gene.length; i = i + 3) {
        totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
        totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
    }

    const minTargetDistance = 0;//minTarget / AU;
    const maxTargetDistance = 0;//maxTarget / AU;
    const minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    const maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    const MAX_TRIP_TIME = 3 * SECONDS_IN_YEAR;
    const MAX_NEWTON_SECONDS = 200 * SECONDS_IN_YEAR;
    const boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    const programDistance = (totalProgram > MAX_TRIP_TIME) ? ((MAX_TRIP_TIME - totalProgram) / (MAX_TRIP_TIME)) : 0;
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance + minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
}


// Create 100 random genes
let genes: Gene[] = [];
for (let i = 0; i < 100; i++) {
    genes.push(randomizeGene(initialGene, 1));
}



let results: { gene: Gene, distance: number }[] = [];

let bestRating = 100;
let lastRating = 100;
let step = 1;
let bestResults: { gene: Gene, distance: number }[] = [];
let worseCount = 0;
let history: number[] = [];
const breed = (results: { gene: Gene, distance: number }[]) => {

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
    if (rating > bestRating) {
        worseCount++;

        if (bestResults.length > 0 && worseCount > 10) {
            results = bestResults;
            console.log(`RESETTING TO BEST RESULTS Step: ${step}, ${bestRating} `);
            worseCount = 0;
        }


    } else {
        worseCount = 0;
    }

    step = bestRating / (Math.abs(variance));
    if (step > 1) {
        step = 1;
    }
    console.log(`Step: ${step}, best: ${bestRating} rating: ${rating} `);
    if (rating < bestRating || bestResults.length == 0) {
        bestResults = results;
        bestRating = rating;
    }
    lastRating = rating;

    const newGenes = [];
    for (let i = 0; i < 10; i++) {

        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (let i = 0; i < 10; i++) {
        const gene = results[i].gene;
        if (i == 0) console.log(`Gene ${i} distance: ${results[i].distance} , gene: ${results[i].gene} `);
        let totalBoost = 0;
        let totalProgram = 0
        for (let i = 0; i < gene.length; i = i + 3) {
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

    return newGenes;
}

// Main simulation loop
for (let i = 0; i < 200; i++) {

    results = [];
    for (let gene of genes) {
        const thrustProgram = getThrustProgram(gene);
        let target = { ...ceres };
        const ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram };
        let bodies = [ship, { ...sun }, { ...mars }];
        simulate(5 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene, distance: objectiveFunction(ship, gene) });
    }

    genes = breed(results);
}




