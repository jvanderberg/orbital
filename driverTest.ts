import { CelestialBody, simulate } from "./orbital";

const MAX_THRUST = 200;
// Constants
const AU = 1.496e11; // Astronomical Unit in meters
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
type Gene = number[];
const initialGene = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const gene = initialGene;

const randomizeGene = (gene: Gene, amount: number) => {
    if (amount > 200) {
        amount = 200;
    }
    if (Math.random() < 0.05) {
        amount = amount * 10;
    }


    return gene.map(function (g: number, i) {
        if (i % 3 == 0) {
            let change = Math.random() * SECONDS_IN_DAY * amount - SECONDS_IN_DAY * amount / 2;
            return g + change > 0 ? g + change : 0;

        } else if ((i % 3) == 1) {
            let change = Math.random() * amount - amount / 2;
            return (g + change) % 360;
        } else if ((i % 3) == 2) {
            // return MAX_THRUST;
            let change = Math.random() * amount - amount / 2;
            return g + change > MAX_THRUST ? MAX_THRUST : g + change < 0 ? 0 : g + change;
        }
    });

}


const getThrustProgram = (gene: Gene) => {
    return [[gene[0], gene[1], gene[2]], [gene[3], gene[4], gene[5]], [gene[6], gene[7], gene[8]], [gene[9], gene[10], gene[11]], [gene[12], gene[13], gene[14]]];
};

const sun = { name: 'sun', x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
const earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
const venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
const mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e23, color: 'red', thrust: 0 };
const jupiter = { name: 'jupiter', x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };


const objectiveFunction = (body: CelestialBody, gene: Gene) => {
    const lastYearsDistance = body.lastYearsDistance ? body.lastYearsDistance : [];
    let total = 0;
    let min = 100 * AU;
    let max = 0;
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
    //Every other third position is a boost
    for (let i = 0; i < gene.length - 3; i = i + 3) {
        //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
        totalBoost = totalBoost + gene[i] * gene[i + 2];
        totalProgram = totalProgram + gene[i];
    }
    //console.log(` totalBoost: ${totalBoost}, totalProgram: ${totalProgram}`);

    const avg = total / lastYearsDistance.length;
    const minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    const maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    const MAX_NEWTON_SECONDS = 100 * SECONDS_IN_YEAR
    const boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    const programDistance = totalProgram > SECONDS_IN_YEAR * 2 ? (totalProgram - SECONDS_IN_YEAR * 2) / (SECONDS_IN_YEAR * 2) : 0;
    // console.log(`minDistance: ${minDistance}, maxDistance: ${maxDistance}`);
    return Math.sqrt(minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance * programDistance * programDistance);
    // const v = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    // return Math.abs(v - 24130);
}


// Create 100 random genes
let genes = [];
for (let i = 0; i < 100; i++) {
    genes.push(randomizeGene(initialGene, 1000));
}


// Function that calculates the distance in AU from sun
const distanceFromSun = (body: CelestialBody) => {
    return Math.sqrt(body.x * body.x + body.y * body.y);
}
let results: { gene: Gene, distance: number }[] = [];

let lastBest = 100;
let step = 100;
let lastResults: { gene: Gene, distance: number }[] = [];
const breed = (results: { gene: Gene, distance: number }[]) => {



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
    let best = results[0].distance;
    if (lastBest) {

        // 0.08
        // 0.07
        console.log(`Best: ${best}, lastBest: ${lastBest}, diff: ${lastBest - best}`);
        let pctChange = (lastBest - best) / lastBest;
        if (pctChange < 0) {
            //Getting worse
            const diff = Math.abs(pctChange);
            if (diff > 1) {
                step = step / 2;
            } else if (diff > 0.5) {
                step = step - step / 4;
            } else if (diff > 0.1) {
                step = step - step / 8;
            }
            //Reset to previous results
            results = lastResults;
            console.log(`RESETTING TO PREVIOUS RESULTS Step: ${step}, pctChange: ${pctChange}`);
            // If we got worse, we should try again with the best genes from last passs

        } else if (pctChange < 0.01) {
            //Getting better too slowly
            step = step * 2;
        }
        console.log(`Step: ${step}, pctChange: ${pctChange}`);
        lastBest = best;

    }
    lastResults = results;
    results.sort((a, b) => a.distance - b.distance);
    const newGenes = [];
    for (let i = 0; i < 10; i++) {

        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (let i = 0; i < 10; i++) {
        console.log(`Gene ${i} distance: ${results[i].distance} , gene: ${results[i].gene}`);


        for (let k = 1; k < 6; k++) {

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
}

// Main simulation loop
for (let i = 0; i < 200; i++) {

    results = [];
    for (let gene of genes) {
        const thrustProgram = getThrustProgram(gene);
        const ship = { name: 'ship', x: -  AU, y: 0, vx: 0, vy: -30000, mass: 1e6, color: 'white', thrust: 0, thrustProgram };
        let bodies = [{ ...sun }, ship, { ...mars },];
        simulate(5 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene, distance: objectiveFunction(ship, gene) });
    }
    genes = breed(results);
}




