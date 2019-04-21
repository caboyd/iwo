import { glMatrix, mat3, mat4, quat, vec3 } from "gl-matrix";

const SPEED: number = 200.0;
const SENSITIVITY: number = 0.005;

export enum Camera_Movement {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT,
    UP,
}

let forward = vec3.create();
let right = vec3.create();
let temp_quat = quat.create();
let temp = vec3.create();

let FORWARD = vec3.fromValues(0,0,-1);

export class Camera {
    public position: vec3;
    public front: vec3;
    public up: vec3;

    private worldUp: vec3;
    private worldRight: vec3;
    
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
        this.worldRight = vec3.fromValues(1,0,0);
        
        this.up = vec3.clone(up);
        vec3.normalize(this.up,this.up);
        
        // console.log(this.front);
        // console.log(this.worldRight);
        // console.log(this.up);
        
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
        mat4.translate(out, out, vec3.negate(temp, this.position));
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
            vec3.scaleAndAdd(this.position,this.position,forward,velocity);
        } else if (direction == Camera_Movement.BACKWARD) {
            vec3.scaleAndAdd(this.position,this.position,forward,-velocity);
        } else if (direction == Camera_Movement.LEFT) {
            vec3.scaleAndAdd(this.position,this.position,right,-velocity);
        } else if (direction == Camera_Movement.RIGHT) {
            vec3.scaleAndAdd(this.position,this.position,right,velocity);
        }else if(direction == Camera_Movement.UP){
            vec3.scaleAndAdd(this.position,this.position,this.worldUp,velocity);
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
        let pitch_quat = quat.setAxisAngle(quat.create(), this.worldRight, this.pitch);
        let heading_quat = quat.setAxisAngle(quat.create(), this.worldUp, this.heading);

        quat.identity(this.orientation);
        quat.mul(this.orientation, this.orientation, pitch_quat);
        quat.mul(this.orientation, this.orientation, heading_quat);
        
     //   console.log(this.orientation);
     //   console.log(this.getRight(vec3.create()));
    }
}
