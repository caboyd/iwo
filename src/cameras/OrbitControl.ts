import { Camera, Camera_Movement } from "./Camera";
import { mat4, vec3, vec4 } from "gl-matrix";

export interface OrbitControlOptions {
    mouse_sensitivity?: number;
    orbit_point?: vec3;
    minimum_distance?: number;
}

export class OrbitControl {
    private camera: Camera;

    private target_pitch: number = 0;
    private target_heading: number = 0;

    private readonly mouse_sensitivity: number = 0.005;
    private readonly step_size: number = 0.5;
    private readonly minimum_distance: number = 5.0;
    public orbit_point: vec3 = [0, 0, 0];

    public constructor(camera: Camera, options?: OrbitControlOptions) {
        this.camera = camera;
        this.mouse_sensitivity = options?.mouse_sensitivity ?? this.mouse_sensitivity;
        this.orbit_point = options?.orbit_point ?? this.orbit_point;
        this.minimum_distance = options?.minimum_distance ?? this.minimum_distance;
        this.camera.lookAt(this.orbit_point);
    }

    public update(): void {}

    // public processKeyboard(direction: Camera_Movement): void {
    //
    //     //move camera
    //     //move orbit point
    //
    //     forward = this.getForward(forward);
    //     right = this.getRight(right);
    //
    //     if (direction == Camera_Movement.FORWARD) {
    //         vec3.scaleAndAdd(this.position, this.position, forward, velocity);
    //     } else if (direction == Camera_Movement.BACKWARD) {
    //         vec3.scaleAndAdd(this.position, this.position, forward, -velocity);
    //     } else if (direction == Camera_Movement.LEFT) {
    //         vec3.scaleAndAdd(this.position, this.position, right, -velocity);
    //     } else if (direction == Camera_Movement.RIGHT) {
    //         vec3.scaleAndAdd(this.position, this.position, right, velocity);
    //     } else if (direction == Camera_Movement.UP) {
    //         vec3.scaleAndAdd(this.position, this.position, this.worldUp, velocity);
    //     }
    // }

    public scroll(scroll_direction_forward: boolean): void {
        let step_dir = vec3.sub(vec3.create(), this.orbit_point, this.camera.position);
        let new_len = vec3.len(step_dir);
        new_len += this.step_size * (scroll_direction_forward ? 1 : -1);
        new_len = Math.max(this.minimum_distance, new_len);
        console.log(step_dir, vec3.len(step_dir));
        step_dir = vec3.normalize(step_dir, step_dir);

        step_dir = vec3.scale(step_dir, step_dir, new_len);

        vec3.sub(this.camera.position, this.orbit_point, step_dir);
        console.log(this.camera.position, step_dir, new_len);
    }

    public processMouseMovement(xOffset: number, yOffset: number, constrainPitch: boolean = true): void {
        if (xOffset === 0 && yOffset === 0) return;

        //rotate about orbit_point

        xOffset *= this.mouse_sensitivity;
        yOffset *= this.mouse_sensitivity;

        const angle_y = vec3.angle(this.camera.getForward(), this.camera.up);
        console.log(angle_y, Math.PI * 0.92, Math.PI * 0.08);

        if (constrainPitch) {
            if (angle_y > Math.PI * 0.99 && yOffset < 0) yOffset = 0;
            if (angle_y < Math.PI * 0.01 && yOffset > 0) yOffset = 0;
        }

        this.rotateAroundTarget(this.orbit_point, xOffset, yOffset);
    }

    private rotateAroundTarget(target: vec3, x: number, y: number): void {
        //pitch up down
        let new_pos = vec3.sub(vec3.create(), this.camera.position, target);

        const m = mat4.create();

        //pitch up down
        mat4.rotate(m, m, y, this.camera.getRight());
        //yaw left right
        mat4.rotate(m, m, x, this.camera.up);

        let p = vec4.fromValues(new_pos[0], new_pos[1], new_pos[2], 1);
        p = vec4.transformMat4(p, p, m);
        vec3.set(new_pos, p[0], p[1], p[2]);

        new_pos = vec3.add(new_pos, new_pos, target);
        this.camera.position = new_pos;
        this.camera.lookAt(target);
    }
}
