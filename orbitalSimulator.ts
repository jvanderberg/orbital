import { AU, CERES, CelestialBody, EARTH, Gene, MARS, MAX_THRUST, SECONDS_IN_YEAR, SUN, applyGravity, applyThrust, getThrustProgram } from "./orbital";

// Setup the canvas and context
const canvas = document.getElementById('orbitalCanvas') as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
const DUTY_CYCLE = 0.1;
// Constants
const SCALE = 100 / AU; // Scale factor for drawing
const DT = 3600; // Time step in seconds
const skipTimeSteps = Math.floor(100000 / DT);
const SECONDS_IN_DAY = 86400;
let steps = 0;
// 0.13409543933165083,0.6007355982634026,0.0028882056459908234,0.0015955713587360722,0.004700943881977136,0.24034273509403378,0.001215152331173178,0.37787658634372756,0.053295355999716604,0.24914993057368232,0.40774939873268917,0.0025248628106645924 

const initialGene: Gene = [0.09530567616654266, 0, 0, 0.2395645288836077, 0, 0, 0.006935552975618892, 0, 0, 0.04322119952390119, 0, 0, 0.501136452090216, 0.003551658523728714, 0.5185935925429491, 0.05278547524934966, 0.9062280974199522, 0.676461815554625, 0.5750877606555509, 0.4096814894686363, 0.05900537099789856, 0.46938489181323984, 0.8113155965955294, 0.6624485321252126, 0.8113893524724478, 0.01586635563775942, 0.014495427327020615, 0.1576340944627103, 0.9846982918210953, 0.9306115381243135, 0.021146829562971998, 0.0029630841937146263, 0.4708054249335842, 0.00000395867648729266];
const gene: Gene = initialGene;


const thrustProgram = getThrustProgram(gene);


const something: CelestialBody = { name: 'ship', x: -1 * AU, y: 0, vx: 0, vy: -29783, mass: 1e6, color: 'green', thrusting: false, thrust: 0, thrustProgram: thrustProgram, thrustAngle: 0 };

let bodies: CelestialBody[] = [something, SUN, EARTH, MARS, CERES];

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
    }
};

// Main simulation loop
const simulate = () => {
    // Clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update positions and apply gravitational forces
    function updateBodies(steps: number) {
        for (let body of bodies) {
            for (let otherBody of bodies) {
                if (body !== otherBody && body.name !== 'sun') {
                    applyGravity(body, otherBody, steps, DT);

                }
            };
            applyThrust(body, steps, DT);

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


simulate();
