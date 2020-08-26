import { Camera, Camera_Movement } from "./Camera";
import { mat4, vec3, vec4 } from "gl-matrix";

export interface OrbitControlOptions {
    mouse_sensitivity?: number;
    orbit_point?: vec3;
    minimum_distance?: number;
    orbit_control_binds?: OrbitControlBinds;
}

export interface OrbitControlBinds {
    LEFT: string;
    RIGHT: string;
    UP: string;
    DOWN: string;
}

export const DefaultOrbitControlBinds: OrbitControlBinds = {
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
    UP: "ArrowUp",
    DOWN: "ArrowDown",
};

export class OrbitControl {
    private camera: Camera;

    private target_pitch: number = 0;
    private target_heading: number = 0;

    private readonly mouse_sensitivity: number = 0.005;
    private readonly step_size: number = 0.5;
    private readonly minimum_distance: number = 5.0;
    private readonly orbit_control_binds: OrbitControlBinds = DefaultOrbitControlBinds;
    public orbit_point: vec3 = [0, 0, 0];

    public constructor(camera: Camera, options?: OrbitControlOptions) {
        this.camera = camera;
        this.mouse_sensitivity = options?.mouse_sensitivity ?? this.mouse_sensitivity;
        this.orbit_point = options?.orbit_point ?? this.orbit_point;
        this.minimum_distance = options?.minimum_distance ?? this.minimum_distance;
        this.orbit_control_binds = options?.orbit_control_binds ?? this.orbit_control_binds;
        this.camera.lookAt(this.orbit_point);

        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (Object.values(this.orbit_control_binds).includes(e.code)) this.processKeyboard(e.code);
        });

        window.addEventListener("wheel", (e: WheelEvent) => {
            e.stopPropagation();
            this.scroll(e.deltaY > 0);
        });
    }

    public update(): void {}

    public processKeyboard(key: string): void {
        const target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.orbit_point);
        if (key === this.orbit_control_binds.LEFT) {
            //move camera based on step_size
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getRight(), -this.step_size);
        } else if (key === this.orbit_control_binds.RIGHT) {
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getRight(), this.step_size);
        } else if (key === this.orbit_control_binds.UP) {
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.up, this.step_size);
        } else if (key === this.orbit_control_binds.DOWN) {
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.up, -this.step_size);
        }
        //place orbit point to same relative position
        vec3.sub(this.orbit_point, this.camera.position, target_to_camera);
        this.camera.lookAt(this.orbit_point);
    }

    public scroll(scroll_direction_forward: boolean): void {
        let target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.orbit_point);
        const dist = vec3.len(target_to_camera);
        let step_scaled_dist = dist + this.step_size * (scroll_direction_forward ? 1 : -1);
        step_scaled_dist = Math.max(this.minimum_distance, step_scaled_dist);

        //Rescale vector
        target_to_camera = vec3.normalize(target_to_camera, target_to_camera);
        target_to_camera = vec3.scale(target_to_camera, target_to_camera, step_scaled_dist);

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
