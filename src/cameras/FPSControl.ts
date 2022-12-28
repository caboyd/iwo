import { vec3 } from "gl-matrix";
import { Camera } from "./Camera";

export interface FPSControlOptions {
    mouse_sensitivity: number;
    speed: number;
    forward_sprint_modifier: number;
    binds: FPSControlBinds;
}

export interface FPSControlBinds {
    FORWARD: string;
    LEFT: string;
    BACKWARD: string;
    RIGHT: string;
    UP: string;
    DOWN: string;
    SPRINT: string;
}

type ActiveKeys = {
    [key: string]: boolean;
};

export const DefaultFPSControlBinds: FPSControlBinds = {
    FORWARD: "KeyW",
    LEFT: "KeyA",
    BACKWARD: "KeyS",
    RIGHT: "KeyD",
    UP: "Space",
    DOWN: "KeyC",
    SPRINT: "ShiftLeft",
};

const DefaultFPSControlOptions: FPSControlOptions = {
    mouse_sensitivity: 1,
    speed: 100,
    forward_sprint_modifier: 2,
    binds: DefaultFPSControlBinds,
};

export class FPSControl {
    private camera: Camera;

    private mouse_x_total: number = 0;
    private mouse_y_total: number = 0;
    private is_mouse_down: boolean = false;
    public mouse_active: boolean;

    public readonly opt: FPSControlOptions;
    public readonly active_keys: ActiveKeys = Object.fromEntries(
        Object.entries(DefaultFPSControlBinds).map(([k, v]) => [v, false])
    );

    public constructor(camera: Camera, options: Partial<FPSControlOptions> = DefaultFPSControlOptions) {
        this.camera = camera;
        this.mouse_active = true;

        this.opt = { ...DefaultFPSControlOptions, ...options };

        document.addEventListener("keydown", this.keydownEventCallback);
        document.addEventListener("keyup", this.keyupEventCallback);
        document.addEventListener("mousemove", this.mousemoveCallback);
        document.addEventListener("mousedown", this.mouseDownCallback);
        document.addEventListener("mouseup", this.mouseUpCallback);
    }

    private keydownEventCallback = (e: KeyboardEvent) => {
        this.active_keys[e.code] = true;
    };

    private keyupEventCallback = (e: KeyboardEvent) => {
        this.active_keys[e.code] = false;
    };

    private mouseDownCallback = (e: MouseEvent) => {
        if (!this.mouse_active) return;
        if (e.button === 0) this.is_mouse_down = true;
    };

    private mouseUpCallback = (e: MouseEvent) => {
        if (!this.mouse_active) return;
        if (e.button === 0) this.is_mouse_down = false;
    };

    private mousemoveCallback = (e: MouseEvent): void => {
        // @ts-ignore
        const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        // @ts-ignore
        const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        if (this.is_mouse_down) {
            this.mouse_y_total += movementY;
            this.mouse_x_total += movementX;
        }
    };

    public update(delta_ms: number = 1000 / 60): void {
        this.processKeyboard(delta_ms);
        this.processMouseMovement(delta_ms);
    }

    public destroy(): void {
        document.removeEventListener("keydown", this.keydownEventCallback);
        document.removeEventListener("keyup", this.keyupEventCallback);
        document.removeEventListener("mousemove", this.mousemoveCallback, false);
        document.removeEventListener("mousedown", this.mouseDownCallback, false);
        document.removeEventListener("mouseup", this.mouseUpCallback, false);
    }

    private processKeyboard(delta_ms: number): void {
        const binds = this.opt.binds;
        const velocity = (this.opt.speed * delta_ms) / 10000;

        let forward = this.camera.getForward();
        let right = this.camera.getRight();
        let pos_ptr = this.camera.position;

        if (this.active_keys[binds.FORWARD]) {
            if (this.active_keys[binds.SPRINT])
                vec3.scaleAndAdd(pos_ptr, pos_ptr, forward, velocity * this.opt.forward_sprint_modifier);
            else vec3.scaleAndAdd(pos_ptr, pos_ptr, forward, velocity);
        }
        if (this.active_keys[binds.BACKWARD]) {
            vec3.scaleAndAdd(pos_ptr, pos_ptr, forward, -velocity);
        }

        if (this.active_keys[binds.LEFT]) {
            vec3.scaleAndAdd(pos_ptr, pos_ptr, right, -velocity);
        }
        if (this.active_keys[binds.RIGHT]) {
            vec3.scaleAndAdd(pos_ptr, pos_ptr, right, velocity);
        }

        if (this.active_keys[binds.UP]) {
            vec3.scaleAndAdd(pos_ptr, pos_ptr, this.camera.worldUp, velocity);
        }
        if (this.active_keys[binds.DOWN]) {
            vec3.scaleAndAdd(pos_ptr, pos_ptr, this.camera.worldUp, -velocity);
        }
    }

    public processMouseMovement(delta_ms: number): void {
        let xOffset = (this.mouse_x_total * delta_ms) / 5000;
        let yOffset = (this.mouse_y_total * delta_ms) / 5000;

        if (xOffset === 0 && yOffset === 0) return;

        xOffset *= this.opt.mouse_sensitivity;
        yOffset *= this.opt.mouse_sensitivity;

        this.camera.heading += xOffset;
        if (this.camera.heading > 2 * Math.PI) this.camera.heading -= 2 * Math.PI;
        if (this.camera.heading < 0) this.camera.heading += 2 * Math.PI;

        this.camera.pitch += yOffset;
        if (this.camera.pitch > Math.PI) this.camera.pitch -= 2 * Math.PI;
        if (this.camera.pitch < -Math.PI) this.camera.pitch += 2 * Math.PI;

        //Constrain pitch always
        if (this.camera.pitch > Math.PI / 2) this.camera.pitch = Math.PI / 2;
        if (this.camera.pitch < -Math.PI / 2) this.camera.pitch = -Math.PI / 2;

        this.camera.recalculateOrientation();

        this.mouse_x_total = 0;
        this.mouse_y_total = 0;
    }
}
