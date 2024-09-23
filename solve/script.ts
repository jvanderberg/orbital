import { iterate } from '../driverTest.ts';
import { resetSimulation, startSimulation } from '../orbitalSimulator.ts';
import { DT, CelestialBody, getThrustProgram, AU, SUN, MARS, CERES, SHIP } from '../orbital.ts';
import { breed, BreedType, Gene, randomizeGene, Result, SECONDS_IN_YEAR } from '../orbital.ts';
let parms: BreedType | null = null;
const WORKERS_COUNT = 8;
const workers: Worker[] = [];
let results: BreedType[] = [];
let running: boolean = false;
let bestRating = 100;
let bestGene: Gene = [];
function formatNumber(significantFigures: number) {
    return function (value: number) {
        if (typeof value !== 'number' || typeof significantFigures !== 'number') {
            throw new TypeError('Both value and significantFigures should be numbers.');
        }

        // Check if exponential notation is necessary
        const exponentNeeded = Math.abs(value) < 0.0001 || Math.abs(value) >= 1e7;

        if (exponentNeeded) {
            return value.toExponential(significantFigures - 1);
        } else {
            return Number(value.toPrecision(significantFigures)).toString();
        }
    }
}

const format3 = formatNumber(3);
function initWorkers() {
    for (let i = 0; i < WORKERS_COUNT; i++) {
        let worker = new Worker(new URL('../driverTest.ts', import.meta.url), {
            type: 'module'
        });
        worker.onmessage = (e) => {
            results.push(e.data.result);

            if (results.length === WORKERS_COUNT) {
                //concatenate parms.results
                const allResults = results.reduce((acc, val) => acc.concat(val.results), [] as Result[]);
                const parms2 = results[0];
                parms2.results = allResults;
                parms = parms2;
                //  parms.step = -1;
                const bestRatingElem = window.document.getElementById('bestRating') as HTMLInputElement;
                if (bestRatingElem) {
                    bestRatingElem.value = format3(parms.bestRating);
                }

                const step = window.document.getElementById('step') as HTMLInputElement;
                if (step) {
                    step.value = format3(parms.step);
                }
                const worstCount = window.document.getElementById('worstCount') as HTMLInputElement;
                if (worstCount) {
                    worstCount.value = parms.worseCount.toString();
                }

                if (parms.bestRating < bestRating) {
                    bestRating = parms.bestRating;
                    bestGene = parms.bestResults[0].gene;
                    const absBestElem = window.document.getElementById('absBest') as HTMLInputElement;
                    if (absBestElem) {
                        absBestElem.value = format3(bestRating);
                    }
                    const bestGeneElem = window.document.getElementById('bestGene') as HTMLInputElement;
                    if (bestGeneElem) {
                        bestGeneElem.value = bestGene.map(format3).toString();
                    }

                }

                parms = breed(parms);
                if (running) {
                    run();
                }


            };

        }
        workers.push(worker);

    }
}

declare global {
    interface Window {
        startRun: () => void;
        stopRun: () => void;
    }
}
const initialGene2: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,];
const initialGene1: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let genes: Gene[] = [];
for (let i = 0; i < 120; i++) {
    genes.push(randomizeGene(initialGene1, 1));
}
initWorkers();
const bestGeneFromFirstIteration = [0.501136452090216, 0.003551658523728714, 0.5185935925429491, 0.05278547524934966, 0.9062280974199522, 0.676461815554625, 0.5750877606555509, 0.4096814894686363, 0.05900537099789856, 0.46938489181323984, 0.8113155965955294, 0.6624485321252126, 0.8113893524724478, 0.01586635563775942, 0.014495427327020615, 0.1576340944627103, 0.9846982918210953, 0.9306115381243135, 0.021146829562971998, 0.0029630841937146263, 0.4708054249335842, 0.00000395867648729266];



parms = { genes, results: [], bestGene1: bestGeneFromFirstIteration, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };

let timer = 0;

function run() {
    running = true;
    results = [];
    if (!parms) {
        return;
    }
    for (let worker of workers) {
        // divide the genes into WORKER_COUNT parts
        const chunk = Math.ceil(parms.genes.length / WORKERS_COUNT);
        const start = chunk * workers.indexOf(worker);
        const end = start + chunk;
        const genes = parms.genes.slice(start, end);
        worker.postMessage({ type: 'iterate', payload: { parms: { ...parms, genes } } });
    }
}
window.startRun = () => {
    run();
    timer = window.setInterval(() => {
        resetSimulation();
        const bestGene = parms?.bestResults[0].gene;
        if (bestGene) {
            const thrustProgram = getThrustProgram(bestGene);

            const ship = { ...SHIP, thrustProgram };
            let bodies: CelestialBody[] = [ship, { ...SUN }, { ...CERES }];
            startSimulation(5 * SECONDS_IN_YEAR, bodies, DT);
        }

    }, 5000);

}
window.stopRun = () => {
    clearInterval(timer);
    results = [];
    running = false;
    parms = { genes, results: [], bestGene1: bestGeneFromFirstIteration, bestRating: 100, lastRating: 100, step: 1, bestResults: [] as Result[], worseCount: 0, history: [] as number[] };

}