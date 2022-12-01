import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { WebGL } from "@iwo";
import { Material } from "@materials/Material";
import { mat4 } from "gl-matrix";
import { Renderer } from "../graphics/renderer/Renderer";
import { Mesh } from "./Mesh";

export class InstancedMesh {
    public mesh: Mesh;
    public materials: Material[];
    public model_matrix: mat4;
    public instance_matrix: mat4[];

    #instance_buffer: WebGLBuffer | undefined;
    #buffer_sent_to_gpu: boolean = false;

    public constructor(mesh: Mesh, materials: Material[] | Material) {
        this.mesh = mesh;
        this.materials = [materials].flat(2);
        if (this.materials.length === 0) throw "InstancedMesh requires material";
        if (this.mesh.instances && this.mesh.instances > 0)
            throw "InstancedMesh does not work with mesh using instances";

        this.model_matrix = mat4.create();
        this.instance_matrix = [];
    }

    public addInstance(instance: mat4) {
        this.instance_matrix.push(mat4.clone(instance));
        this.#buffer_sent_to_gpu = false;
    }

    private updateBuffer(gl: WebGL2RenderingContext, shader: Shader) {
        if (this.#instance_buffer) gl.deleteBuffer(this.#instance_buffer);
        //FIXME: this won't work if other meshinstances are using this mesh becuase we are messing with the attributes.
        this.mesh.vertex_buffer.bind(gl);
        const buffer = new Float32Array(this.instance_matrix.length * 16);
        for (let i = 0; i < this.instance_matrix.length; i++) {
            const mat = this.instance_matrix[i];
            buffer.set(mat, i * 16);
        }
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
                        [ShaderSource.Define.INSTANCING]
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
        renderer.prepareMaterialShaders(this.materials, [ShaderSource.Define.INSTANCING]);
        if (!this.mesh.initialized) {
            //Assumes every material shader in this mesh has same attribute layout
            this.mesh.setupVAO(
                renderer.gl,
                renderer.getorCreateShader(this.materials[0].shaderSource, [ShaderSource.Define.INSTANCING])
            );
        }
        if (!this.#buffer_sent_to_gpu) {
            this.updateBuffer(
                renderer.gl,
                renderer.getorCreateShader(this.materials[0].shaderSource, [ShaderSource.Define.INSTANCING])
            );
            this.#buffer_sent_to_gpu = true;
        }
    }
}
