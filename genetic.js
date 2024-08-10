// Setup the canvas and context
const canvas = document.getElementById('orbitalCanvas');
const ctx = canvas.getContext('2d');

// Constants
const G = 6.67430e-11; // Gravitational constant
const AU = 1.496e11; // Astronomical Unit in meters
const SCALE = 40 / AU; // Scale factor for drawing
const DT = 60; // Time step in seconds
const skipTimeSteps = Math.floor(1000000 / DT);
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
let steps = 0;
const initialGene = [SECONDS_IN_DAY * 300, SECONDS_IN_DAY * 300, SECONDS_IN_DAY * 200]
const gene = initialGene;

const getThrustProgram = (gene) => {
    return [[gene[0], 0, 20], [gene[1], 0, 0], [gene[2], 0, 20]];
};
const thrustProgram = getThrustProgram(gene);
let vox = 0;
let voy = 0;
// Create celestial bodies
const sun = { x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
const earth = { x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
const something = { x: - AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'white', thrust: 30, thrustProgram: thrustProgram };
//const something2 = { x: 2.524 * AU, y: 0, vx: 0, vy: 19130, mass: 1e6, color: 'white', thrust: 20 };
const venus = { x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
const mars = { x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 6.39e23, color: 'red', thrust: 0 };
const jupiter = { x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };
let bodies = [something, sun, earth, mars, jupiter, venus];

const objectiveFunction = (body) => {
    const v = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    return Math.abs(v - 24130);
}
// Update position based on velocity
const updatePosition = (body) => ({
    ...body,
    x: body.x + body.vx * DT,
    y: body.y + body.vy * DT,
});

//Take x and y and return the angle
const angle = (x, y) => {
    return Math.atan2(y, x);
}

// Apply gravitational force from another body
const applyGravity = (body, other) => {
    const dx = other.x - body.x;
    const dy = other.y - body.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const force = G * body.mass * other.mass / (distance * distance);
    let thax = 0;
    let thay = 0;
    if (body.thrustProgram) {
        const seconds = steps * DT;
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
        }
    }
    // Don't let the sun move, errors add up too quickly with its mass
    const ax = force * (body.mass === sun.mass ? 0 : 1) * dx / distance / body.mass + thax;
    const ay = force * (body.mass === sun.mass ? 0 : 1) * dy / distance / body.mass + thay;

    return {
        ...body,
        vx: body.vx + ax * DT,
        vy: body.vy + ay * DT,

    };
};

// Draw the body on the canvas
const drawBody = (body) => {
    ctx.beginPath();
    ctx.arc(body.x * SCALE + canvas.width / 2, body.y * SCALE + canvas.height / 2, 1, 0, 2 * Math.PI);
    ctx.fillStyle = body.color;
    ctx.fill();
    ctx.closePath();
};

// Main simulation loop
const simulate = () => {
    // Clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update positions and apply gravitational forces
    const updateBodies = () => bodies.map(body =>
        bodies.reduce((updatedBody, otherBody) => {
            if (body !== otherBody) {
                return applyGravity(updatedBody, otherBody);
            }
            return updatedBody;
        }, body)
    ).map(updatePosition);

    for (let i = 0; i < skipTimeSteps; i++) {
        steps++;
        bodies = updateBodies();
    }

    // Draw the bodies
    bodies.forEach(drawBody);

    const years = document.getElementById('years');
    const yrs = steps * DT / SECONDS_IN_YEAR;
    //format yrs to 2 decimal places
    years.innerHTML = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(yrs);
    const vel = document.getElementById('velocity');
    const velx = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Math.sqrt(bodies[0].vx * bodies[0].vx + bodies[0].vy * bodies[0].vy));
    vel.innerHTML = velx;

    if (yrs < 10) {
        // Request the next frame
        requestAnimationFrame(simulate);
    }

};

// Start the simulation
let guesses = [];
guesses[0] = initialGene;
for (let i = 0; i < 100; i++) {
    simulate();
    const obj = objectiveFunction(bodies[0]);

}
