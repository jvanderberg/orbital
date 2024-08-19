import { CelestialBody, simulate } from "./orbital";

const MAX_THRUST = 200;
// Constants
const AU = 1.496e11; // Astronomical Unit in meters
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
type Gene = number[];
//const initialGene: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const initialGene: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.12300962214132607, 0.12101378154876138, 0.5496749637933072, 0.29171336854962376, 0.8037955672505628, 0.4217128896868013, 0.16605191625088947, 0.30818242691796305, 0.3496808280898503, 0.3379723401755871, 0.020577830824870563, 0.0005527808377004901, 0.40823469913233273, 0.028159325930123016, 0.8730573937450536, 0.23003645531349712, 0.014539726635089671, 0.01908477147783302, 0.11156969479757897, 0.9884400682810122, 0.1783389342382798, 0.39993926057519236, 0.9999524198385803, 0.5815829464181033, 0.4312312034028322, 0.636191440452341, 0.30960853194613736];
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

    //Splice in a 1 year coast in the middle
    // if (Math.random() < amount) {
    //     const index = Math.floor(Math.random() * gene.length);
    //     gene.splice(index, 0, 1, 0, 0);
    // }
    return gene.map(function (g: number, i) {

        if (i > 17) {
            return g;
        }
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
        if (i > 17) {
            thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], gene[i + 2] > 0.5 ? MAX_THRUST : 0]);
        } else {
            // Initial coast
            thrustProgram.push([SECONDS_IN_YEAR * gene[i], 0, 0]);
        }
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
    // console.log(minTarget / AU, maxTarget / AU, minTarget - maxTarget);

    for (let i = 0; i < gene.length; i = i + 3) {
        if (i > 17) {

            //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
        }
        else {

            totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
        }
    }

    // const distanceFromCeres = Math.sqrt((body.x - target.x) * (body.x - target.x) + (body.y - target.y) * (body.y - target.y));
    // console.log(`Distance from Ceres: ${distanceFromCeres}`);
    const minTargetDistance = minTarget / AU;
    const maxTargetDistance = maxTarget / AU;
    const minDistance = Math.abs(min - 1.524 * AU) / (1.524 * AU);
    const maxDistance = Math.abs(max - 1.524 * AU) / (1.524 * AU);
    // let ceresDistance = 0;//distanceFromCeres > 1e8 ? distanceFromCeres / AU : 0;
    // console.log(`Ceres distance: ${ceresDistance}`); 
    //console.log(`${lastYearsTargetDistance.map(d => d / AU)}`);
    //console.log(`MinTarget: ${minTargetDistance}, MaxTarget: ${maxTargetDistance}`);
    const avg = total / lastYearsDistance.length;
    const MAX_TRIP_TIME = 10 * SECONDS_IN_YEAR;
    // console.log(`Min: ${ min }, Max: ${ max }, MinTarget: ${ minTarget }, MaxTarget: ${ maxTarget }, Avg: ${ avg }, TotalBoost: ${ totalBoost / SECONDS_IN_YEAR}, TotalProgram: ${ totalProgram / SECONDS_IN_YEAR}`);
    const MAX_NEWTON_SECONDS = 500 * SECONDS_IN_YEAR;
    const boostDistance = totalBoost > MAX_NEWTON_SECONDS ? (totalBoost - MAX_NEWTON_SECONDS) / (MAX_NEWTON_SECONDS) : 0;
    const programDistance = (totalProgram > MAX_TRIP_TIME) ? ((MAX_TRIP_TIME - totalProgram) / (MAX_TRIP_TIME)) : 0;
    //console.log(programDistance);
    //return Math.sqrt(totalProgram / SECONDS_IN_YEAR);
    return Math.sqrt(minTargetDistance * minTargetDistance + maxTargetDistance * maxTargetDistance + minDistance * minDistance + maxDistance * maxDistance + boostDistance * boostDistance + programDistance * programDistance);
}


// Create 100 random genes
let genes: Gene[] = [];
for (let i = 0; i < 100; i++) {
    genes.push(initialGene);
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

    //console.log(`rating: ${ rating }, best: ${ bestRating }, diff: ${ lastRating - rating } `);
    let pctChange = (bestRating - rating) / bestRating;
    //console.log(`pctChange: ${ worseCount }, ${ pctChange } `);
    if (rating > bestRating) {
        worseCount++;
        //Getting worse
        // const diff = Math.abs(pctChange);
        // if (diff > 1) {
        //     step = step / 2;
        // } else if (diff > 0.5) {
        //     step = step - step / 4;
        // } else if (diff > 0.1) {
        //     step = step - step / 8;
        // }
        //Reset to previous results
        if (bestResults.length > 0 && worseCount > 10) {



            results = bestResults;

            console.log(`RESETTING TO BEST RESULTS Step: ${step}, ${bestRating} `);
            worseCount = 0;
        }


        // If we got worse, we should try again with the best genes from last passs
    } else {
        worseCount = 0;
        // if (pctChange < 0.01) {
        //     //Getting better too slowly
        //     if (rating > 0.1) {
        //         step = step + step * 100;
        //     } else {
        //         step = step * 10;
        //     }
        // }
    }
    // } else if (pctChange < 0.01) {
    //     //Getting better too slowly
    //     if (rating > 0.1) {
    //         step = step + step * 100;
    //     } else {
    //         step = step * 2;
    //     }
    // }
    step = bestRating * 2;
    // if (bestRating > 0.001) {
    //     step = bestRating;
    // }
    // // if (bestRating < 1e6) {
    //     step = bestRating * 10;
    // }
    // if (bestRating > 0.001) {
    //     step = bestRating / 2;
    // }

    // step = bestRating / (Math.abs(variance));
    // if (variance > 1) {
    //     step = step / 10;
    // } else if (variance > 0.1) {
    //     step = step / 5;
    // }
    // step = variance;
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

            if (i > 17) {

                //  console.log(`Gene ${i}: ${gene[i]}, ${gene[i + 1]}, ${gene[i + 2]}`);
                totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
                totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
            }
            else {

                totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];
            }
        }
        console.log(` totalBoost: ${totalBoost / SECONDS_IN_YEAR}, totalProgram: ${totalProgram / SECONDS_IN_YEAR} `);


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
        const ship = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 0, thrustProgram };
        let bodies = [ship, { ...sun }, { ...mars }];
        simulate(5 * SECONDS_IN_YEAR, bodies, 3600);
        results.push({ gene, distance: objectiveFunction(ship, gene) });
    }

    genes = breed(results);
}




