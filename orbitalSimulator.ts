import { send } from "vite";
import { AU, CERES, CelestialBody, EARTH, Gene, MARS, MAX_THRUST, SECONDS_IN_YEAR, SUN, applyGravity, applyThrust, getThrustProgram, simulate } from "./orbital";
import { clear } from "console";

// Setup the canvas and context
const canvas = document.getElementById('orbitalCanvas') as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
// Constants
const SCALE = 100 / AU; // Scale factor for drawing
const DT = 3600; // Time step in seconds
const skipTimeSteps = Math.floor(300000 / DT);
const SECONDS_IN_DAY = 86400;
let steps = 0;
// const initialGene: Gene = [0.09530567616654266, 0, 0, 0.2395645288836077, 0, 0, 0.006935552975618892, 0, 0, 0.04322119952390119, 0, 0, 0.501136452090216, 0.003551658523728714, 0.5185935925429491, 0.05278547524934966, 0.9062280974199522, 0.676461815554625, 0.5750877606555509, 0.4096814894686363, 0.05900537099789856, 0.46938489181323984, 0.8113155965955294, 0.6624485321252126, 0.8113893524724478, 0.01586635563775942, 0.014495427327020615, 0.1576340944627103, 0.9846982918210953, 0.9306115381243135, 0.021146829562971998, 0.0029630841937146263, 0.4708054249335842, 0.00000395867648729266];
// const gene: Gene = initialGene;

let animationFrame: number;
//const thrustProgram = getThrustProgram(gene);
let running = false;



// const something: CelestialBody = { name: 'ship', x: -1 * AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'green', thrusting: false, thrust: 0, thrustProgram: thrustProgram, thrustAngle: 0 };

// let bodies: CelestialBody[] = [something, SUN, EARTH, MARS, CERES];

export const objectiveFunction = (body: CelestialBody) => {
    const v = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    return Math.abs(v - 24130);
}
// Update position based on velocity
const updatePosition = (body: CelestialBody) => {
    body.x = body.x + body.vx * DT;
    body.y = body.y + body.vy * DT;
};


// Draw the body on the canvas
const drawBody = (body: CelestialBody) => {

    if (ctx) {
        ctx.beginPath();

        if (body.thrusting) {
            ctx.beginPath();  // Begin the path first
            ctx.moveTo(body.x * SCALE + canvas.width / 2, body.y * SCALE + canvas.height / 2);
            ctx.strokeStyle = `hsl(${360 * body.thrust / MAX_THRUST}, 100%, 50%)`;
            ctx.lineWidth = 2;
            const instDirection = Math.atan2(body.vy, body.vx);
            const thrustDirectionRad = instDirection + body.thrustAngle * Math.PI / 180;
            ctx.lineTo(
                body.x * SCALE + canvas.width / 2 + 50 * body.thrust / MAX_THRUST * Math.cos(thrustDirectionRad),
                body.y * SCALE + canvas.height / 2 + 50 * body.thrust / MAX_THRUST * Math.sin(thrustDirectionRad)
            );
            ctx.stroke();
            ctx.closePath();
        }
        ctx.beginPath();
        ctx.arc(body.x * SCALE + canvas.width / 2, body.y * SCALE + canvas.height / 2, 1, 0, 2 * Math.PI);
        ctx.fillStyle = body.color;
        ctx.fill();
        ctx.closePath();
    }
};

export const resetSimulation = () => {
    steps = 0;
    running = false;
    cancelAnimationFrame(animationFrame);
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
}


// Main simulation loop
export const run = (seconds: number, bodies: CelestialBody[], step: number, steps: number) => {
    // Clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (running) {

        steps = simulate(skipTimeSteps * DT, bodies, step, steps);

        if (steps > seconds) {
            running = false;
            steps = 0;
            cancelAnimationFrame(animationFrame);
            return;
        }


        // Draw the bodies
        bodies.forEach(drawBody);

        const years = document.getElementById('years');
        const yrs = steps * DT / SECONDS_IN_YEAR;
        //format yrs to 2 decimal places
        if (years) {
            years.innerHTML = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(yrs);


        }

        // Request the next frame
        animationFrame = requestAnimationFrame(() => run(seconds, bodies, step, steps));
    }

};


export const startSimulation = (seconds: number, bodies: CelestialBody[], step: number) => {
    running = true;
    run(seconds, bodies, step, steps);
}

export const stopSimulation = () => {
    resetSimulation();
}