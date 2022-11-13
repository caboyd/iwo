import { glMatrix, mat4, vec3, vec4 } from "gl-matrix";

export type FrustumOptions = {
    clip_near: number;
    clip_far: number;
    fov: number;
};

export const DefaultFrustumOptions = {
    clip_near: 1,
    clip_far: 45,
    fov: 90,
} as const;

export class Frustum {
    private opt: FrustumOptions;

    private readonly inverse_view_matrix: mat4;

    private far_height!: number;
    private far_width!: number;
    private near_height!: number;
    private near_width!: number;

    constructor(gl: WebGL2RenderingContext, inverse_view_matrix: mat4, options?: Partial<FrustumOptions>) {
        this.inverse_view_matrix = mat4.clone(inverse_view_matrix);
        this.opt = { ...DefaultFrustumOptions, ...options };
        this.calculateWidthsAndHeights(gl);
    }

    public calculateFrustumCorners(): number[][] {
        const far_top_left = [-this.far_width / 2, this.far_height / 2, -this.opt.clip_far];
        const far_top_right = [this.far_width / 2, this.far_height / 2, -this.opt.clip_far];
        const far_bottom_left = [-this.far_width / 2, -this.far_height / 2, -this.opt.clip_far];
        const far_bottom_right = [this.far_width / 2, -this.far_height / 2, -this.opt.clip_far];
        const near_top_left = [-this.near_width / 2, this.near_height / 2, -this.opt.clip_near];
        const near_top_right = [this.near_width / 2, this.near_height / 2, -this.opt.clip_near];
        const near_bottom_left = [-this.near_width / 2, -this.near_height / 2, -this.opt.clip_near];
        const near_bottom_right = [this.near_width / 2, -this.near_height / 2, -this.opt.clip_near];

        const points = [
            far_top_left,
            far_top_right,
            far_bottom_left,
            far_bottom_right,
            near_top_left,
            near_top_right,
            near_bottom_left,
            near_bottom_right,
        ];

        for (const point of points) {
            //move point to camera space
            let point4f: vec4 = vec4.fromValues(point[0], point[1], point[2], 1.0);
            vec4.transformMat4(point4f, point4f, this.inverse_view_matrix);

            //perspetive divite w component
            point[0] = point4f[0] / point4f[3];
            point[1] = point4f[1] / point4f[3];
            point[2] = point4f[2] / point4f[3];
        }

        return points;
    }

    public calculateWidthsAndHeights(gl: WebGL2RenderingContext): void {
        this.near_height = this.opt.clip_near * 2 * Math.tan(glMatrix.toRadian(this.opt.fov) / 2);
        this.near_width = this.near_height * (gl.drawingBufferWidth / gl.drawingBufferHeight);

        this.far_height = this.opt.clip_far * 2 * Math.tan(glMatrix.toRadian(this.opt.fov) / 2);
        this.far_width = this.far_height * (gl.drawingBufferWidth / gl.drawingBufferHeight);
    }
}
