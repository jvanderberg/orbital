import { AU, SECONDS_IN_YEAR, MAX_THRUST, CelestialBody, simulate, Gene, MARS, SUN, getThrustProgram, Result, BreedType, randomizeGene, breed } from "./orbital";
const initialGene1: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const initialGene2: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,];
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

    const minTargetDistance = Math.abs(minTarget - maxTarget) / AU;
    const maxTargetDistance = Math.abs(maxTarget) / AU;
    //return minTargetDistance;
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance);
}

// Create 100 random genes
// let genes1: Gene[] = [];
// for (let i = 0; i < 100; i++) {
//     genes1.push(randomizeGene(initialGene1, 1));
// }
// let genes2: Gene[] = [];
// for (let i = 0; i < 100; i++) {
//     genes2.push(randomizeGene(initialGene2, 1));
// }




function zeroThrust(g: number, index: number): number {
    if (index % 3 == 0) {
        return g;
    }
    return 0;
}

let results: Result[] = [];

let parms: BreedType = { genes: [], results, bestGene1: [], bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };
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

self.onmessage = function (event: MessageEvent) {
    const { type, payload } = event.data;

    switch (type) {
        case 'iterate':
            const parms = payload.parms as BreedType;
            const result = iterate(parms);
            self.postMessage({ type: 'result', result });
            break;
        default:
            self.postMessage({ type: 'error', message: 'Unknown command' });
            break;
    }
};

export function iterate(parms: BreedType) {
    // Main simulation loop

    console.log(`Best Gene 1: ${parms.bestGene1} `);
    results = [];
    for (let gene of parms.genes) {
        const thrustProgram = getThrustProgram(gene.map(zeroThrust).concat(parms.bestGene1));

        const ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram, thrustAngle: 0 };
        let bodies: CelestialBody[] = [ship, { ...SUN }, { ...MARS }];
        simulate(10 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene, distance: objectiveFunction2(ship) });
        parms.results = results;
    }
    try {
        // parms.step = -1;
        // const breedResult = breed(parms);

        // parms = breedResult;
    } catch (e) {
        // console.log(`Resetting simulation`);
        // results = [];
        // parms = { genes: results, bestGene1: bestGene1, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };
        // genes2 = [];
        // for (let i = 0; i < 100; i++) {
        //     genes2.push(randomizeGene(initialGene2, 1));
        // }

        console.log(`RESETTING ENTIRE SIMULATION Step: ${parms.step}, ${parms.bestRating} `);
        // loops = 200;
    }



    // bestGene2 = parms.bestResults[0].gene;
    // console.log(`Best Gene 2: ${bestGene2} distance: ${parms.bestResults[0].distance} `);
    // console.log(`Done ${bestGene2.concat(bestGene1)} `);
    return parms;
}
