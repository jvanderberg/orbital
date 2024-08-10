"use strict";
// Setup the canvas and context
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulate = void 0;
// Constants
var G = 6.67430e-11; // Gravitational constant
var SECONDS_IN_YEAR = 31536000;
var SECONDS_IN_DAY = 86400;
var SECONDS_IN_MONTH = 2592000;
var applyGravity = function (body, other, steps, timeStep) {
    var dx = other.x - body.x;
    var dy = other.y - body.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    var force = G * body.mass * other.mass / (distance * distance);
    var thax = 0;
    var thay = 0;
    if (body.thrustProgram) {
        var seconds = steps * timeStep;
        var thrustP = void 0;
        var timeTotal = 0;
        for (var i = 0; i < body.thrustProgram.length; i++) {
            timeTotal = timeTotal + body.thrustProgram[i][0];
            if (timeTotal > seconds) {
                thrustP = body.thrustProgram[i];
                break;
            }
        }
        if (thrustP) {
            var thrustDirection = thrustP[1];
            var thrust = thrustP[2];
            var instDirection = Math.atan2(body.vy, body.vx);
            var thrustDirectionRad = instDirection + thrustDirection * Math.PI / 180;
            var thrustX = thrust * Math.cos(thrustDirectionRad);
            var thrustY = thrust * Math.sin(thrustDirectionRad);
            thax = thrustX / body.mass;
            thay = thrustY / body.mass;
        }
    }
    var ax = force * dx / distance / body.mass + thax;
    var ay = force * dy / distance / body.mass + thay;
    body.vx = body.vx + ax * timeStep;
    body.vy = body.vy + ay * timeStep;
};
// Update positions and apply gravitational forces
var updateBodies = function (bodies, steps, timeStep) {
    for (var _i = 0, bodies_1 = bodies; _i < bodies_1.length; _i++) {
        var body = bodies_1[_i];
        for (var _a = 0, bodies_2 = bodies; _a < bodies_2.length; _a++) {
            var otherBody = bodies_2[_a];
            if (body !== otherBody && body.name !== 'sun') {
                applyGravity(body, otherBody, steps, timeStep);
            }
        }
        ;
    }
    for (var _b = 0, bodies_3 = bodies; _b < bodies_3.length; _b++) {
        var body = bodies_3[_b];
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
var AU = 1.496e11; // Astronomical Unit in meters
// Function that calculates the distance in AU from sun
var distanceFromSun = function (body) {
    return Math.sqrt(body.x * body.x + body.y * body.y);
};
// Main simulation loop
var simulate = function (seconds, bodies, timeStep) {
    var steps = 0;
    while (steps * timeStep < seconds) {
        steps++;
        updateBodies(bodies, steps, timeStep);
    }
};
exports.simulate = simulate;
