import { CelestialBody, simulate } from "./orbital";

const DUTY_CYCLE = 0.1;
const MAX_THRUST = 500;
// Constants
const AU = 1.496e11; // Astronomical Unit in meters
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
type Gene = number[];
const initialGene: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const gene = initialGene;

const randomizeGene = (gene: Gene, amount: number): Gene => {
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
        // console.log(`Gene ${i}: ${gene[i]},${gene[i + 1]}, ${gene[i + 2]}, ${gene[i + 3]}`);
        thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], MAX_THRUST * gene[i + 2]]);
    }
    return thrustProgram;
};

const sun = { name: 'sun', x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
const earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
const venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
const mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e23, color: 'red', thrust: 0 };
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
    // console.log(minTarget / AU, maxTarget / AU, minTarget - maxTarget);
    //Every other third position is a boost
    for (let i = 0; i < gene.length; i = i + 4) {
        //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
        totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * (gene[i + 2] > DUTY_CYCLE ? MAX_THRUST : 0);
        totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
    }

    // const distanceFromCeres = Math.sqrt((body.x - target.x) * (body.x - target.x) + (body.y - target.y) * (body.y - target.y));
    // console.log(`Distance from Ceres: ${distanceFromCeres}`);
    const minTargetDistance = 0;//2 * minTarget / AU;
    const maxTargetDistance = 0;// 2 * maxTarget / AU;
    const minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    const maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    // let ceresDistance = 0;//distanceFromCeres > 1e8 ? distanceFromCeres / AU : 0;
    // console.log(`Ceres distance: ${ceresDistance}`); 
    const avg = total / lastYearsDistance.length;
    // console.log(`Min: ${min}, Max: ${max}, MinTarget: ${minTarget}, MaxTarget: ${maxTarget}, Avg: ${avg}, TotalBoost: ${totalBoost / SECONDS_IN_YEAR}, TotalProgram: ${totalProgram / SECONDS_IN_YEAR}`);
    const MAX_NEWTON_SECONDS = 10000 * SECONDS_IN_YEAR;
    const boostDistance = 0; // totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    const programDistance = 0;//(totalProgram > SECONDS_IN_YEAR * 20) ? ((SECONDS_IN_YEAR * 20 - totalProgram) / (SECONDS_IN_YEAR * 20)) : 0;
    // console.log(programDistance);
    //return Math.sqrt(totalProgram / SECONDS_IN_YEAR);
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance + minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
}


// Create 100 random genes
let genes: Gene[] = [];
for (let i = 0; i < 100; i++) {
    genes.push(randomizeGene(initialGene, 1000));
}



let results: { gene: Gene, distance: number }[] = [];

let lastBest = 100;
let step = 1;
let lastResults: { gene: Gene, distance: number }[] = [];
const breed = (results: { gene: Gene, distance: number }[]) => {
    let best = results[0].distance;
    if (lastBest && lastResults.length > 0) {


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
            if (best > 0.1) {
                step = step + step * 100;
            } else {
                step = step * 100;
            }
        }
        if (step > 1) {
            step = 1;
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
        const gene = results[i].gene;
        if (i == 0) console.log(`Gene ${i} distance: ${results[i].distance} , gene: ${results[i].gene}`);
        let totalBoost = 0;
        let totalProgram = 0
        for (let i = 0; i < gene.length; i = i + 3) {
            //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * (gene[i + 2] * MAX_THRUST);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
        }
        console.log(` totalBoost: ${totalBoost / SECONDS_IN_YEAR}, totalProgram: ${totalProgram / SECONDS_IN_YEAR}`);


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
        let target = { ...ceres };
        const ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -20783, mass: 1e6, color: 'white', thrust: 0, thrustProgram };
        let bodies = [ship, { ...sun }, { ...mars }];
        simulate(12 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene, distance: objectiveFunction(ship, gene) });
    }

    genes = breed(results);
}




