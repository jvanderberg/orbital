// Setup the canvas and context
const canvas = document.getElementById('orbitalCanvas');
const ctx = canvas.getContext('2d');
const MAX_THRUST = 200;
// Constants
const G = 6.67430e-11; // Gravitational constant
const AU = 1.496e11; // Astronomical Unit in meters
const SCALE = 100 / AU; // Scale factor for drawing
const DT = 3600; // Time step in seconds
const skipTimeSteps = Math.floor(100000 / DT);
const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_DAY = 86400;
let steps = 0;
const initialGene = [926471.3602910098, -65.20376195980275, 8221.084807031397, 184969.7694903934, 99.80181211884306, 916.8898946100408, 3006102.9182290058, -72.81536587936091, 1101.3153103070297, 1259240.1672957188, -68.91678098809862, 4786.691893607488, 2879398.7102472447, 95.72485877458516, 6100.7530760884665];
const gene = initialGene;

const getThrustProgram = (gene) => {
    return [[gene[0], gene[1], gene[2]], [gene[3], gene[4], gene[5]], [gene[6], gene[7], gene[8]], [gene[9], gene[10], gene[11]], [gene[12], gene[13], gene[14]]];
};


const thrustProgram = getThrustProgram(gene);
let vox = 0;
let voy = 0;
// Create celestial bodies
const sun = { x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
const earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
const venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
const mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 1, color: 'red', thrust: 0 };
const something = { x: -  AU, y: 0, vx: 0, vy: -30000, mass: 1e6, color: 'white', thrust: 30, thrustProgram: thrustProgram, thrusting: false };
//const something2 = { x: 2.524 * AU, y: 0, vx: 0, vy: 19130, mass: 1e6, color: 'white', thrust: 20 };
const jupiter = { x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };
let bodies = [something, sun, mars];

const objectiveFunction = (body) => {
    const v = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    return Math.abs(v - 24130);
}
// Update position based on velocity
const updatePosition = (body) => {
    body.x = body.x + body.vx * DT;
    body.y = body.y + body.vy * DT;
};

//Take x and y and return the angle
const angle = (x, y) => {
    return Math.atan2(y, x);
}

// Apply gravitational force from another body
const applyGravity = (body, other) => {
    const dx = other.x - body.x;
    const dy = other.y - body.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let force = G * body.mass * other.mass / (distance * distance);
    if (other.mass < 1) {
        force = 0;
    }

    // Don't let the sun move, errors add up too quickly with its mass
    const ax = force * dx / distance / body.mass;
    const ay = force * dy / distance / body.mass;


    body.vx = body.vx + ax * DT;
    body.vy = body.vy + ay * DT;

};

const applyThust = (body, steps, timeStep) => {
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

// Draw the body on the canvas
const drawBody = (body) => {
    ctx.beginPath();

    if (body.thrusting) {
        ctx.beginPath();  // Begin the path first
        ctx.moveTo(body.x * SCALE + canvas.width / 2, body.y * SCALE + canvas.height / 2);
        ctx.strokeStyle = `hsl(${360 * body.thrust / 200}, 100%, 50%)`;
        ctx.lineWidth = 2;
        const instDirection = Math.atan2(body.vy, body.vx);
        const thrustDirectionRad = instDirection + body.thrustAngle * Math.PI / 180;
        ctx.lineTo(
            body.x * SCALE + canvas.width / 2 + 100 * body.thrust / 20000 * Math.cos(thrustDirectionRad),
            body.y * SCALE + canvas.height / 2 + 100 * body.thrust / 20000 * Math.sin(thrustDirectionRad)
        );
        ctx.stroke();  // Actually draw the line
        ctx.arc(body.x * SCALE + canvas.width / 2, body.y * SCALE + canvas.height / 2, 1, 0, 2 * Math.PI);
        ctx.fillStyle = body.color;

    } else {
        ctx.arc(body.x * SCALE + canvas.width / 2, body.y * SCALE + canvas.height / 2, 1, 0, 2 * Math.PI);
        ctx.fillStyle = body.color;
    }
    ctx.fill();
    ctx.closePath();
};

// Main simulation loop
const simulate = () => {
    // Clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update positions and apply gravitational forces
    function updateBodies(steps) {
        for (let body of bodies) {
            for (let otherBody of bodies) {
                if (body !== otherBody && body.name !== 'sun') {
                    applyGravity(body, otherBody);
                }
            };
            applyThust(body, steps, DT);
        }
        for (let body of bodies) {
            updatePosition(body);
        }


    }


    for (let i = 0; i < skipTimeSteps; i++) {
        steps++;
        updateBodies(steps);
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

simulate();
