import { mat4, quat, vec3 } from "gl-matrix";

const temp_quat = quat.create();
const temp = vec3.create();

const FORWARD = vec3.fromValues(0, 0, -1);

export class Camera {
    public position: vec3;
    public up: vec3;

    public readonly worldUp: vec3;
    public readonly worldRight: vec3;

    public pitch: number = 0;
    public heading: number = 0;

    private readonly orientation: quat;

    public constructor(pos: vec3, forward: vec3 = FORWARD, up: vec3 = vec3.fromValues(0, 1, 0)) {
        this.orientation = quat.create();
        this.position = vec3.clone(pos);
        this.worldUp = vec3.fromValues(0, 1, 0);
        this.worldRight = vec3.fromValues(1, 0, 0);

        this.up = vec3.clone(up);
        vec3.normalize(this.up, this.up);

        this.lookAt(forward);
    }

    public getRight(out: vec3 = vec3.create()): vec3 {
        quat.conjugate(temp_quat, this.orientation);
        vec3.set(out, 1, 0, 0);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }

    public getForward(out: vec3 = vec3.create()): vec3 {
        quat.conjugate(temp_quat, this.orientation);
        vec3.set(out, 0, 0, -1);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }

    public getUp(out: vec3 = vec3.create()): vec3 {
        quat.conjugate(temp_quat, this.orientation);
        vec3.set(out, 0, 1, 0);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }

    public lookAt(target: vec3): void {
        const forward = vec3.sub(vec3.create(), target, this.position);
        vec3.normalize(forward, forward);
        this.pitch = -Math.asin(forward[1]);
        this.heading = -(Math.atan2(forward[0], forward[2]) - Math.PI);

        this.recalculateOrientation();
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

    public recalculateOrientation(): void {
        const pitch_quat = quat.setAxisAngle(quat.create(), this.worldRight, this.pitch);
        const heading_quat = quat.setAxisAngle(quat.create(), this.worldUp, this.heading);

        quat.identity(this.orientation);
        quat.mul(this.orientation, this.orientation, pitch_quat);
        quat.mul(this.orientation, this.orientation, heading_quat);

        //   console.log(this.orientation);
        //   console.log(this.getRight(vec3.create()));
    }
}
