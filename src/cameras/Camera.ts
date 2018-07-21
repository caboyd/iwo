import { glMatrix, mat3, mat4, quat, vec3 } from "gl-matrix";

const SPEED: number = 200.0;
const SENSITIVITY: number = 0.005;

export enum Camera_Movement {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT
}

let forward = vec3.create();
let right = vec3.create();
let temp_quat = quat.create();

let FORWARD = vec3.fromValues(0,0,-1);

export class Camera {
    public position: vec3;
    public front: vec3;
    public up: vec3;

    private right: vec3;
    private worldUp: vec3;

    private movementSpeed: number;
    private mouseSensitivity: number;

    private pitch: number;
    private heading: number;

    private orientation: quat;

    constructor(pos: vec3, forward: vec3 = FORWARD, up: vec3 = vec3.fromValues(0, 1, 0)) {
        this.position = vec3.clone(pos);
        this.front = vec3.clone(forward);
        vec3.normalize(this.front,this.front);
        
        this.worldUp = vec3.fromValues(0, 1, 0);
        this.right = vec3.cross(vec3.create(), this.front, up);
        this.right[0] = Math.abs(this.right[0]);
        vec3.normalize(this.right,this.right);
        
        this.up = vec3.cross(vec3.create(), this.right,this.front);
        
        vec3.normalize(this.up,this.up);
        
        console.log(this.front);
        console.log(this.right);
        console.log(this.up);
        
        this.movementSpeed = SPEED;
        this.mouseSensitivity = SENSITIVITY;

        this.pitch = -Math.asin(this.front[1]);
        this.heading = -(Math.atan2(this.front[0], this.front[2]) - Math.PI);

        this.orientation = quat.create();
        this.calculateOrientation();
    }

    public getRight(out: vec3): vec3 {
        quat.conjugate(temp_quat,this.orientation);
        vec3.set(out,1,0,0);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }
    
    public getForward(out:vec3):vec3{
        quat.conjugate(temp_quat,this.orientation);
        vec3.set(out,0,0,-1);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }

    public lookAt(target: vec3): void {
        vec3.sub(this.front, target, this.position);
        vec3.normalize(this.front, this.front);
        this.pitch = -Math.asin(this.front[1]);
        this.heading = -(Math.atan2(this.front[0], this.front[2]) - Math.PI);

        this.calculateOrientation();
    }

    public getViewMatrix(out: mat4): mat4 {
        mat4.fromQuat(out, this.orientation);
        mat4.translate(out, out, vec3.negate(vec3.create(), this.position));
        return out;
    }

    public getInverseViewMatrix(out: mat4): mat4 {
        out = this.getViewMatrix(out);
        mat4.invert(out, out);
        return out;
    }

    public processKeyboard(direction: Camera_Movement, deltaTime: number): void {
        let velocity: number = this.movementSpeed * deltaTime;

        forward = this.getForward(forward);
        right = this.getRight(right);

        if (direction == Camera_Movement.FORWARD) {
            vec3.scale(forward, forward, velocity);
            vec3.add(this.position, this.position, forward);
        } else if (direction == Camera_Movement.BACKWARD) {
            vec3.scale(forward, forward, -velocity);
            vec3.add(this.position, this.position, forward);
        } else if (direction == Camera_Movement.LEFT) {
            vec3.scale(right, right, -velocity);
            vec3.add(this.position, this.position, right);
        } else if (direction == Camera_Movement.RIGHT) {
            vec3.scale(right, right, velocity);
            vec3.add(this.position, this.position, right);
        }
    }

    public processMouseMovement(xOffset: number, yOffset: number, constrainPitch: boolean = true): void {
        if (xOffset === 0 && yOffset === 0) return;

        xOffset *= this.mouseSensitivity;
        yOffset *= this.mouseSensitivity;

        this.heading += xOffset;
        if (this.heading > 2 * Math.PI) this.heading -= 2 * Math.PI;
        if (this.heading < 0) this.heading += 2 * Math.PI;

        this.pitch += yOffset;
        if (this.pitch > Math.PI) this.pitch -= 2 * Math.PI;
        if (this.pitch < -Math.PI) this.pitch += 2 * Math.PI;

        if (constrainPitch) {
            if (this.pitch > Math.PI / 2) this.pitch = Math.PI / 2;
            if (this.pitch < -Math.PI / 2) this.pitch = -Math.PI / 2;
        }
        
        this.calculateOrientation();
    }

    private calculateOrientation() {
        let pitch_quat = quat.setAxisAngle(quat.create(), this.right, this.pitch);
        let heading_qat = quat.setAxisAngle(quat.create(), this.worldUp, this.heading);

        quat.identity(this.orientation);
        quat.mul(this.orientation, this.orientation, pitch_quat);
        quat.mul(this.orientation, this.orientation, heading_qat);
    }
}
