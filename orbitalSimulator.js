// Setup the canvas and context
const canvas = document.getElementById('orbitalCanvas');
const ctx = canvas.getContext('2d');
const DUTY_CYCLE = 0.1;
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
const initialGene = [0.383964, 0, 0, 0.12300962214132607, 0.12101378154876138, 0.5496749637933072, 0.29171336854962376, 0.8037955672505628, 0.4217128896868013, 0.16605191625088947, 0.30818242691796305, 0.3496808280898503, 0.3379723401755871, 0.020577830824870563, 0.0005527808377004901, 0.40823469913233273, 0.028159325930123016, 0.8730573937450536, 0.23003645531349712, 0.014539726635089671, 0.01908477147783302, 0.11156969479757897, 0.9884400682810122, 0.1783389342382798, 0.39993926057519236, 0.9999524198385803, 0.5815829464181033, 0.4312312034028322, 0.636191440452341, 0.30960853194613736];
const gene = initialGene;

const getThrustProgram = (gene) => {
    // Convert gene to thrust program
    // Each gene is 3 values: time, direction, thrust
    // Time is in years, direction is in degrees, thrust is in newtons
    // The thrust program is a list of genes
    // The thrust program is a list of genes
    const thrustProgram = [];
    for (let i = 0; i < gene.length; i += 3) {
        if (i > 0) {
            thrustProgram.push([SECONDS_IN_YEAR * gene[i], 360 * gene[i + 1], gene[i + 2] > 0.5 ? MAX_THRUST : 0]);
            console.log(thrustProgram);
        } else {
            thrustProgram.push([gene[0] * 5 * SECONDS_IN_YEAR, 0, 0]);
        }
    }
    return thrustProgram;
};



const thrustProgram = getThrustProgram(gene);
let vox = 0;
let voy = 0;
// Create celestial bodies
const sun = { x: 0, y: 0, vx: 0, vy: 0, mass: 1.989e30, color: 'yellow', thrust: 0 };
const earth = { name: 'earth', x: AU, y: 0, vx: 0, vy: 29783, mass: 5.972e24, color: 'blue' };
const venus = { name: 'venus', x: 0.723 * AU, y: 0, vx: 0, vy: 35020, mass: 4.87e24, color: 'green', thrust: 0 };
const mars = { name: 'mars', x: 1.524 * AU, y: 0, vx: 0, vy: 24130, mass: 1, color: 'red', thrust: 0 };

const something = { name: 'ship', x: -1 * AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'green', thrusting: false, thrust: 0, thrustProgram: thrustProgram };
//const something2 = { x: 2.524 * AU, y: 0, vx: 0, vy: 19130, mass: 1e6, color: 'white', thrust: 20 };
const jupiter = { x: 5.203 * AU, y: 0, vx: 0, vy: 13070, mass: 1.898e27, color: 'orange', thrust: 0 };
const ceres = { x: 2.77 * AU, y: 0, vx: 0, vy: 17900, mass: 9.393e20, color: 'gray', thrust: 0 };


let bodies = [something, sun, earth, mars, ceres];

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
            if (Number.isNaN(thax)) {
                debugger;
            }
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
            body.x * SCALE + canvas.width / 2 + 50 * body.thrust / MAX_THRUST * Math.cos(thrustDirectionRad),
            body.y * SCALE + canvas.height / 2 + 50 * body.thrust / MAX_THRUST * Math.sin(thrustDirectionRad)
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
                    if (!bodies[0].vx) {
                        debugger;
                    }
                }
            };
            applyThust(body, steps, DT);
            if (!bodies[0].vx) {
                debugger;
            }
        }
        if (!bodies[0].vx) {
            debugger;
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

    //const pos = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Math.sqrt(bodies[0].x));
    vel.innerHTML = velx;

    if (yrs < 21) {
        // Request the next frame
        requestAnimationFrame(simulate);
    }

};

// Start the simulation
let guesses = [];
guesses[0] = initialGene;

simulate();
