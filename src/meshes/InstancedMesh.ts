import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { WebGL } from "@iwo";
import { Material } from "@materials/Material";
import { mat4, vec3, vec4 } from "gl-matrix";
import { Renderer } from "../graphics/renderer/Renderer";
import { Mesh } from "./Mesh";

let tmp_vec3 = vec3.create();
let tmp2_vec3 = vec3.create();
let tmp_vec4 = vec4.create();
let tmp_mat4 = mat4.create();

export class InstancedMesh {
    public mesh: Mesh;
    public materials: Material[];
    public model_matrix: mat4 = mat4.create();
    public instance_matrix: mat4[] = [];

    #instance_buffer: WebGLBuffer | undefined;
    #instance_count_in_buffer: number = 0;
    #buffer_sent_to_gpu: boolean = false;

    static readonly Defines: ShaderSource.Define_Flags = ShaderSource.Define_Flag.INSTANCING;

    public constructor(mesh: Mesh, materials: Material[] | Material) {
        this.mesh = mesh;
        this.materials = [materials].flat(2);
        if (this.materials.length === 0) throw "InstancedMesh requires material";
        if (this.mesh.instances && this.mesh.instances > 0)
            throw "InstancedMesh does not work with mesh using instances";
    }

    public addInstance(instance: mat4) {
        this.instance_matrix.push(mat4.clone(instance));
        this.#buffer_sent_to_gpu = false;
    }

    public refreshBuffer(): void {
        this.#buffer_sent_to_gpu = false;
    }

    public sortBackToFront(camera: vec3) {
        this.#buffer_sent_to_gpu = false;
        this.instance_matrix.sort((a, b) => {
            const pos_a = mat4.getTranslation(tmp_vec3, a);
            const pos_b = mat4.getTranslation(tmp2_vec3, b);
            return vec3.sqrDist(camera, pos_b) - vec3.sqrDist(camera, pos_a);
        });
    }

    public sortBackToFrontInViewSpace(view_mat: mat4) {
        this.#buffer_sent_to_gpu = false;
        this.instance_matrix.sort((a, b) => {
            mat4.multiply(tmp_mat4, view_mat, a);
            const pos_a = mat4.getTranslation(tmp_vec3, tmp_mat4);
            // vec3.transformMat4(pos_a, pos_a, view_mat);
            mat4.multiply(tmp_mat4, view_mat, b);
            const pos_b = mat4.getTranslation(tmp2_vec3, tmp_mat4);
            // vec3.transformMat4(pos_b, pos_b, view_mat);
            return pos_a[2] - pos_b[2];
        });
    }

    private updateBuffer(gl: WebGL2RenderingContext, shader: Shader) {
        //if no buffer or buffer too small or 2x too big, remake it.
        if (
            !this.#instance_buffer ||
            this.instance_matrix.length > this.#instance_count_in_buffer ||
            this.instance_matrix.length < this.#instance_count_in_buffer / 2
        ) {
            if (this.#instance_buffer) gl.deleteBuffer(this.#instance_buffer);
            //TODO: this won't work if other meshinstances are using this mesh becuase we are messing with the attributes.
            this.mesh.vertex_buffer.bind(gl);
            const buffer = new Float32Array(this.instance_matrix.length * 16);
            for (let i = 0; i < this.instance_matrix.length; i++) {
                const mat = this.instance_matrix[i];
                buffer.set(mat, i * 16);
            }
            this.#instance_count_in_buffer = this.instance_matrix.length;
            this.#instance_buffer = WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, buffer);

            const instance_loc = gl.getAttribLocation(shader.ID, "a_instance");

            const stride = 4 * 16;
            for (let i = 0; i < 4; i++) {
                const loc = instance_loc + i;

                gl.enableVertexAttribArray(loc);
                const offset = i * 16;
                gl.vertexAttribPointer(
                    loc, // location
                    4, // component_count
                    gl.FLOAT, // type
                    false, // normalize
                    stride, // stride
                    offset // offset
                );
                gl.vertexAttribDivisor(loc, 1);
            }
        } else {
            const buffer = new Float32Array(this.instance_matrix.length * 16);
            for (let i = 0; i < this.instance_matrix.length; i++) {
                const mat = this.instance_matrix[i];
                buffer.set(mat, i * 16);
            }
            //reuse buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#instance_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer);
        }

        gl.bindVertexArray(null);
    }

    public render(renderer: Renderer, view_matrix: mat4, proj_matrix: mat4): void {
        this.prepareMesh(renderer);

        renderer.setPerModelUniforms(this.model_matrix, view_matrix, proj_matrix);

        for (let i = 0; i < this.materials.length; i++) {
            const mat = this.materials[i];
            let submeshes_rendered = 0;

            for (const submesh of this.mesh.sub_meshes) {
                if (submesh.material_index === i) {
                    renderer.drawInstanced(
                        this.mesh.draw_mode,
                        submesh.count,
                        submesh.offset,
                        this.instance_matrix.length,
                        submesh.index_buffer,
                        submesh.vertex_buffer,
                        mat,
                        InstancedMesh.Defines
                    );
                    submeshes_rendered++;
                }
            }
            if (submeshes_rendered !== this.mesh.sub_meshes.length) {
                console.warn(`Mesh has unrendered submeshes due to incorrect materials or material_index`);
            }
        }
    }

    public renderWithMaterial(renderer: Renderer, view_matrix: mat4, proj_matrix: mat4, mat: Material) {
        this.prepareMesh(renderer);
        renderer.setPerModelUniforms(this.model_matrix, view_matrix, proj_matrix);
        for (const submesh of this.mesh.sub_meshes) {
            if (this.mesh.instances) {
                renderer.drawInstanced(
                    this.mesh.draw_mode,
                    submesh.count,
                    submesh.offset,
                    this.instance_matrix.length,
                    submesh.index_buffer,
                    submesh.vertex_buffer,
                    mat
                );
            }
        }
    }

    private prepareMesh(renderer: Renderer) {
        renderer.prepareMaterialShaders(this.materials, InstancedMesh.Defines);
        if (!this.mesh.initialized) {
            //Assumes every material shader in this mesh has same attribute layout
            this.mesh.setupVAO(
                renderer.gl,
                renderer.getorCreateShader(this.materials[0].shaderSource, InstancedMesh.Defines)
            );
        }
        if (!this.#buffer_sent_to_gpu) {
            this.updateBuffer(
                renderer.gl,
                renderer.getorCreateShader(this.materials[0].shaderSource, InstancedMesh.Defines)
            );
            this.#buffer_sent_to_gpu = true;
        }
    }
}
