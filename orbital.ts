// Setup the canvas and context

// Constants
const G = 6.67430e-11; // Gravitational constant
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
const SECONDS_IN_MONTH = 2592000;

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
    lastDistanceTime?: number;
    thrustProgram?: number[][];
}

const applyGravity = (body: CelestialBody, other: CelestialBody, steps: number, timeStep: number) => {
    const dx = other.x - body.x;
    const dy = other.y - body.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const force = G * body.mass * other.mass / (distance * distance);



    const ax = force * dx / distance / body.mass;
    const ay = force * dy / distance / body.mass;

    body.vx = body.vx + ax * timeStep;
    body.vy = body.vy + ay * timeStep;

};
const applyThust = (body: CelestialBody, steps: number, timeStep: number) => {
    // Calculate thrust
    let thax = 0;
    let thay = 0;
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
            if (body !== otherBody && body.name !== 'sun') {
                applyGravity(body, otherBody, steps, timeStep);
            }
        };

        if (body.thrustProgram !== undefined) {
            applyThust(body, steps, timeStep);
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
            body.lastYearsDistance.push(distanceFromSun(body));
            if (body.lastYearsDistance.length > 12) {
                body.lastYearsDistance.shift();
            }
        }
        // if (steps % 100 === 0) {
        //     const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy)
        //     const distance = distanceFromSun(body);
        //     // Calculate running average speed

        //     if (body.avgSpeed === undefined) {
        //         body.avgSpeed = speed;
        //     } else {
        //         body.avgSpeed = (body.avgSpeed * 0.99 + speed * 0.01);
        //     }
        //     if (body.avgDistance === undefined) {
        //         body.avgDistance = distance;
        //     } else {
        //         body.avgDistance = (body.avgDistance * 0.99 + distance * 0.01);
        //     }
        // }

    }
};

const AU = 1.496e11; // Astronomical Unit in meters

// Function that calculates the distance in AU from sun
const distanceFromSun = (body: CelestialBody): number => {
    return Math.sqrt(body.x * body.x + body.y * body.y);
}
// Main simulation loop
export const simulate = (seconds: number, bodies: CelestialBody[], timeStep: number) => {
    let steps = 0;

    while (steps * timeStep < seconds) {
        steps++;
        updateBodies(bodies, steps, timeStep);
    }
};


