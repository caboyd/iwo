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
        let target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.orbit_point);
        let step_modified_length = vec3.len(target_to_camera);
        step_modified_length += this.step_size * (scroll_direction_forward ? 1 : -1);
        step_modified_length = Math.max(this.minimum_distance, step_modified_length);

        //Rescale vector
        target_to_camera = vec3.normalize(target_to_camera, target_to_camera);
        target_to_camera = vec3.scale(target_to_camera, target_to_camera, step_modified_length);

        //Set camera back to scaled vector position
        vec3.add(this.camera.position, this.orbit_point, target_to_camera);
    }

    public processMouseMovement(xOffset: number, yOffset: number, constrainPitch: boolean = true): void {
        if (xOffset === 0 && yOffset === 0) return;

        //rotate about orbit_point

        xOffset *= this.mouse_sensitivity;
        yOffset *= this.mouse_sensitivity;

        const angle_y = vec3.angle(this.camera.getForward(), this.camera.up);

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
