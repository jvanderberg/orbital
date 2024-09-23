// Setup the canvas and context

// Constants
export const AU: number = 1.496e11; // Astronomical Unit in meters
export const G = 6.67430e-11; // Gravitational constant
export const SECONDS_IN_YEAR = 31536000;
export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_MONTH = 2592000;
export const MAX_THRUST = 200;
export const DT = 3600; // Time step in seconds
export type Thrust = [number, number, number];
export type ThrustProgram = Thrust[];
export type Gene = number[];
export type Result = { gene: Gene, distance: number };
export type Parms = { gene: Gene, distance: number };
export type BreedType = { genes: Gene[], results: Result[], bestGene1: Gene, bestRating: number, lastRating: number, step: number, bestResults: Result[], worseCount: number, history: number[] };

export type CelestialBody = {
    name: string;
    mass: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    avgSpeed?: number;
    avgDistance?: number;
    lastYearsDistance?: number[];
    lastYearDistanceTarget?: number[];
    lastDistanceTime?: number;
    thrustProgram?: number[][];
    thrusting?: boolean;
    thrust: number;
    thrustAngle: number;
}

export const SUN: CelestialBody = { x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0, name: 'sun', thrustAngle: 0 };
export const EARTH: CelestialBody = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue', thrust: 0, thrustAngle: 0 };
export const VENUS: CelestialBody = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0, thrustAngle: 0 };
export const MARS: CelestialBody = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 1, color: 'red', thrust: 0, thrustAngle: 0 };
export const JUPITER: CelestialBody = { x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0, thrustAngle: 0, name: 'jupiter' };
export const CERES: CelestialBody = { x: 2.77 * AU, y: 0, vx: 0, vy: 17900, mass: 9.393e20, color: 'gray', thrust: 0, thrustAngle: 0, name: 'ceres' };
export const SHIP = { name: 'ship', x: -AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'yellow', thrust: 0, thrustProgram: [], thrustAngle: 0 };

export const applyGravity = (body: CelestialBody, other: CelestialBody, steps: number, timeStep: number) => {
    const dx = other.x - body.x;
    const dy = other.y - body.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const force = G * body.mass * other.mass / (distance * distance);

    const ax = force * dx / distance / body.mass;
    const ay = force * dy / distance / body.mass;

    body.vx = body.vx + ax * timeStep;
    body.vy = body.vy + ay * timeStep;

};


export const getThrustProgram = (gene: Gene): ThrustProgram => {
    // Convert gene to thrust program
    // Each gene is 3 values: time, direction, thrust
    // Time is in years, direction is in degrees, thrust is in newtons
    // The thrust program is a list of genes
    // The thrust program is a list of genes
    const thrustProgram: Thrust[] = [];

    for (let i = 0; i < gene.length; i += 3) {

        thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], gene[i + 2] > 0.5 ? MAX_THRUST : 0] as [number, number, number]);
    }
    return thrustProgram;
};

export const applyThrust = (body: CelestialBody, steps: number, timeStep: number) => {
    // Calculate thrust
    let thax = 0;
    let thay = 0;
    body.thrusting = false;
    body.thrust = 0;
    if (body.thrustProgram) {
        const seconds = steps * timeStep;
        let thrustP;
        let timeTotal = 0;
        for (let i = 0; i < body.thrustProgram.length; i++) {
            timeTotal = timeTotal + body.thrustProgram[i][0];
            if (timeTotal > seconds) {
                thrustP = body.thrustProgram[i];
                break;
            }
        }
        if (thrustP) {
            const thrustDirection = thrustP[1];
            const thrust = thrustP[2];
            const instDirection = Math.atan2(body.vy, body.vx);
            const thrustDirectionRad = instDirection + thrustDirection * Math.PI / 180;
            if (thrust > 0) {
                body.thrusting = true;
                body.thrust = thrust;
                body.thrustAngle = thrustDirection;
            }
            const thrustX = thrust * Math.cos(thrustDirectionRad);
            const thrustY = thrust * Math.sin(thrustDirectionRad);
            thax = thrustX / body.mass;
            thay = thrustY / body.mass;
            body.vx = body.vx + thax * timeStep;
            body.vy = body.vy + thay * timeStep;
        }

    }

};

// Update positions and apply gravitational forces
const updateBodies = (bodies: CelestialBody[], steps: number, timeStep: number) => {
    for (let body of bodies) {
        for (let otherBody of bodies) {
            if ((body.name === "ship" && otherBody.name === "mars") || (body.name === "mars" && otherBody.name === "ship")) {
                continue;
            }
            if (body !== otherBody && body.name !== 'sun') {
                applyGravity(body, otherBody, steps, timeStep);
            }
        };

        if (body.thrustProgram !== undefined) {
            applyThrust(body, steps, timeStep);
        }
    }

    for (let body of bodies) {
        body.x = body.x + body.vx * timeStep;
        body.y = body.y + body.vy * timeStep;
        if (body.lastDistanceTime === undefined || steps * timeStep - body.lastDistanceTime > SECONDS_IN_MONTH) {
            body.lastDistanceTime = steps * timeStep;
            if (body.lastYearsDistance === undefined) {
                body.lastYearsDistance = [];
            }
            if (body.lastYearDistanceTarget === undefined) {
                body.lastYearDistanceTarget = [];
            }
            body.lastYearsDistance.push(distanceFromSun(body));
            if (body.lastYearsDistance.length > 12) {
                body.lastYearsDistance.shift();
            }
            body.lastYearDistanceTarget.push(distanceFromTarget(body, bodies));
            if (body.lastYearDistanceTarget.length > 12) {
                body.lastYearDistanceTarget.shift();
            }
        }


    }
};


// Function that calculates the distance in AU from sun
const distanceFromSun = (body: CelestialBody): number => {
    return Math.sqrt(body.x * body.x + body.y * body.y);
}
var distanceFromTarget = function (body: CelestialBody, bodies: CelestialBody[]) {
    const dx = body.x - bodies[2].x;
    const dy = body.y - bodies[2].y;
    return Math.sqrt(dx * dx + dy * dy);

};
// Main simulation loop
export const simulate = (seconds: number, bodies: CelestialBody[], timeStep: number, steps: number = 0): number => {
    let startStep = steps;

    while ((steps - startStep) * timeStep < seconds) {
        steps++;
        updateBodies(bodies, steps, timeStep);
        if (distanceFromSun(bodies[0]) > 8 * AU) {

            // Exit the program if the ship is too far from the sun
            return steps;

        }
    }
    return steps;
};


export const randomizeGene = (gene: Gene, amount: number): Gene => {
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

export const breed = ({ results, bestRating, bestGene1, lastRating, step, bestResults, history, worseCount }: BreedType): BreedType => {

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
    // if (bestRating < 1e-8) {
    //     loops = 0;
    // }
    if (bestRating > 1e-6 && worseCount > 20) {
        //Entirely reset the simulation
        //throw new Error('Resetting simulation');
    }

    if (step === -1) {
        step = bestRating / (Math.abs(variance));
    } else if (worseCount < 20) {

        step = bestRating / (Math.abs(variance));
    }
    if (step > 1) {
        step = 1;
    }
    if (rating < bestRating || bestResults.length == 0) {
        bestResults = results;
        bestRating = rating;
    }
    if (worseCount >= 30) {
        step = 10;
        worseCount = 0;
        bestRating = 100;
        bestResults = [];

    }


    lastRating = rating;
    const newGenes: Gene[] = [];
    for (let i = 0; i < 10; i++) {

        newGenes.push(randomizeGene(results[0].gene, step));
    }
    for (let i = 0; i < 10; i++) {
        const gene = results[i].gene;
        if (i == 0) console.log(`Gene ${i} distance: ${results[i].distance} , gene: ${results[i].gene} `);
        let totalBoost = 0;
        let totalProgram = 0
        for (let i = 0; i < gene.length; i = i + 3) {
            totalBoost = totalBoost + SECONDS_IN_YEAR * gene[i] * ((gene[i + 2] > 0.5) ? MAX_THRUST : 0);
            totalProgram = totalProgram + SECONDS_IN_YEAR * gene[i];


        }

        for (let k = 1; k < 12; k++) {

            newGenes.push(randomizeGene(results[i].gene, step));
        }


    }

    return { genes: newGenes, results, bestGene1, bestRating, lastRating, step, bestResults, worseCount, history };
}