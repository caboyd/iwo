import { mat4, vec3, vec4 } from "gl-matrix";
import { Camera } from "./Camera";

export interface OrbitControlOptions {
    mouse_sensitivity: number;
    orbit_point: vec3;
    minimum_distance: number;
    maximum_distance: number;
    scroll_step_size: number;
    arrow_step_size: number;
    constrain_pitch: boolean;
    binds: OrbitControlBinds;
}

export interface OrbitControlBinds {
    LEFT: string;
    RIGHT: string;
    UP: string;
    DOWN: string;
    RESET: string;
}

type ActiveKeys = {
    [key: string]: boolean;
};

export const DefaultOrbitControlBinds: OrbitControlBinds = {
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
    UP: "ArrowUp",
    DOWN: "ArrowDown",
    RESET: "KeyR",
};

const DefaultOrbitControlOptions: OrbitControlOptions = {
    mouse_sensitivity: 0.005,
    orbit_point: [0, 0, 0],
    minimum_distance: 1,
    maximum_distance: 10,
    arrow_step_size: 0.05,
    scroll_step_size: 0.5,
    constrain_pitch: true,
    binds: DefaultOrbitControlBinds,
};

export class OrbitControl {
    private camera: Camera;

    private mouse_x_total: number = 0;
    private mouse_y_total: number = 0;
    private scroll_y_total: number = 0;

    public reset_orbit_point: vec3;
    public readonly opt: OrbitControlOptions;

    private is_mouse_down: boolean = false;

    public readonly active_keys: ActiveKeys = Object.fromEntries(
        Object.entries(DefaultOrbitControlBinds).map(([k, v]) => [v, false])
    );

    public constructor(camera: Camera, options: Partial<OrbitControlOptions> = DefaultOrbitControlOptions) {
        this.camera = camera;

        this.opt = { ...DefaultOrbitControlOptions, ...options };
        this.reset_orbit_point = vec3.clone(this.opt.orbit_point);
        this.camera.lookAt(this.opt.orbit_point);

        document.addEventListener("keydown", this.keydownEventCallback);
        document.addEventListener("keyup", this.keyupEventCallback);
        document.addEventListener("mousemove", this.mousemoveCallback, false);
        document.addEventListener("mousedown", this.mouseDownCallback, false);
        document.addEventListener("mouseup", this.mouseUpCallback, false);
        document.addEventListener("wheel", this.mousewheelCallback);
    }

    private mouseDownCallback = (e: MouseEvent) => {
        if (e.button === 0) this.is_mouse_down = true;
    };

    private mouseUpCallback = (e: MouseEvent) => {
        if (e.button === 0) this.is_mouse_down = false;
    };

    private keydownEventCallback = (e: KeyboardEvent) => {
        this.active_keys[e.code] = true;
    };

    private keyupEventCallback = (e: KeyboardEvent) => {
        this.active_keys[e.code] = false;
    };

    private mousemoveCallback = (e: MouseEvent): void => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        if (this.is_mouse_down) {
            this.mouse_y_total += movementY;
            this.mouse_x_total += movementX;
        }
    };

    private mousewheelCallback = (e: WheelEvent) => {
        e.stopPropagation();
        this.scroll_y_total += e.deltaY;
    };

    public update(delta_ms: number = 1000 / 60): void {
        if (this.scroll_y_total != 0) this.scroll(this.scroll_y_total > 0);
        this.processMouseMovement(delta_ms);
        this.processKeyboard(delta_ms);
    }

    public destroy(): void {
        document.removeEventListener("keydown", this.keydownEventCallback);
        document.removeEventListener("keyup", this.keyupEventCallback);
        document.removeEventListener("mousemove", this.mousemoveCallback);
        document.removeEventListener("wheel", this.mousewheelCallback);
        document.removeEventListener("mousedown", this.mouseDownCallback);
        document.removeEventListener("mouseup", this.mouseUpCallback);
    }

    public processKeyboard(delta_ms: number): void {
        const bind = this.opt.binds;
        const opt = this.opt;
        const cam = this.camera;
        const step_size = opt.arrow_step_size * delta_ms * (60 / 1000);

        let target_to_camera = vec3.sub(vec3.create(), cam.position, opt.orbit_point);

        if (this.active_keys[bind.LEFT]) {
            //move camera based on step_size
            vec3.scaleAndAdd(cam.position, cam.position, cam.getRight(), -step_size);
        }
        if (this.active_keys[bind.RIGHT]) {
            vec3.scaleAndAdd(cam.position, cam.position, cam.getRight(), step_size);
        }
        if (this.active_keys[bind.UP]) {
            vec3.scaleAndAdd(cam.position, cam.position, cam.up, step_size);
        }
        if (this.active_keys[bind.DOWN]) {
            vec3.scaleAndAdd(cam.position, cam.position, cam.up, -step_size);
        }
        if (this.active_keys[bind.RESET]) {
            vec3.copy(this.opt.orbit_point, this.reset_orbit_point);
            vec3.sub(target_to_camera, cam.position, opt.orbit_point);
        }

        //place orbit point to same relative position
        vec3.sub(this.opt.orbit_point, this.camera.position, target_to_camera);
        this.camera.lookAt(this.opt.orbit_point);
    }

    public scroll(scroll_direction_forward: boolean): void {
        this.scroll_y_total = 0;
        let target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.opt.orbit_point);
        const dist = vec3.len(target_to_camera);
        let step_scaled_dist = dist + this.opt.scroll_step_size * (scroll_direction_forward ? 1 : -1);
        step_scaled_dist = Math.max(this.opt.minimum_distance, step_scaled_dist);
        step_scaled_dist = Math.min(this.opt.maximum_distance, step_scaled_dist);

        //Rescale vector
        target_to_camera = vec3.normalize(target_to_camera, target_to_camera);
        target_to_camera = vec3.scale(target_to_camera, target_to_camera, step_scaled_dist);

        //Set camera back to scaled vector position
        vec3.add(this.camera.position, this.opt.orbit_point, target_to_camera);
    }

    public processMouseMovement(delta_ms: number): void {
        let xOffset = -this.mouse_x_total;
        let yOffset = -this.mouse_y_total;

        if (xOffset === 0 && yOffset === 0) return;

        //rotate about orbit_point

        xOffset *= this.opt.mouse_sensitivity * delta_ms * (60 / 1000);
        yOffset *= this.opt.mouse_sensitivity * delta_ms * (60 / 1000);

        const angle_y = vec3.angle(this.camera.getForward(), this.camera.up);

        if (this.opt.constrain_pitch) {
            if (angle_y > Math.PI * 0.99 && yOffset < 0) yOffset = 0;
            if (angle_y < Math.PI * 0.01 && yOffset > 0) yOffset = 0;
        }

        this.rotateAroundTarget(this.opt.orbit_point, xOffset, yOffset);

        this.mouse_x_total = 0;
        this.mouse_y_total = 0;
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
