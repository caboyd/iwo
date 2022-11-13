import { mat4 } from "gl-matrix";
import { Material } from "materials/Material";
import { Renderer } from "../graphics/Renderer";
import { Mesh } from "./Mesh";

export class MeshInstance {
    public mesh: Mesh;
    public materials: Material[];

    public model_matrix: mat4;

    public constructor(mesh: Mesh, materials: Material[] | Material) {
        this.mesh = mesh;
        this.materials = [materials].flat();
        if (this.materials.length === 0) throw "MeshInstance requires material";

        this.model_matrix = mat4.create();
    }

    public render(renderer: Renderer, view_matrix: mat4, proj_matrix: mat4): void {
        this.prepareMesh(renderer);

        renderer.setPerModelUniforms(this.model_matrix, view_matrix, proj_matrix);
        for (const [i, mat] of this.materials.entries()) {
            let submeshes_rendered = 0;

            for (const submesh of this.mesh.sub_meshes) {
                if (submesh.material_index === i) {
                    if (this.mesh.instances) {
                        renderer.drawInstanced(
                            this.mesh.draw_mode,
                            submesh.count,
                            submesh.offset,
                            this.mesh.instances,
                            submesh.index_buffer,
                            submesh.vertex_buffer,
                            mat
                        );
                    } else {
                        renderer.draw(
                            this.mesh.draw_mode,
                            submesh.count,
                            submesh.offset,
                            submesh.index_buffer,
                            submesh.vertex_buffer,
                            mat
                        );
                    }

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
                    this.mesh.instances,
                    submesh.index_buffer,
                    submesh.vertex_buffer,
                    mat
                );
            } else {
                renderer.draw(
                    this.mesh.draw_mode,
                    submesh.count,
                    submesh.offset,
                    submesh.index_buffer,
                    submesh.vertex_buffer,
                    mat
                );
            }
        }
    }

    private prepareMesh(renderer: Renderer) {
        renderer.prepareMaterialShaders(this.materials);
        if (!this.mesh.initialized) {
            //Assumes every material shader in this mesh has same attribute layout
            this.mesh.setupVAO(renderer.gl, renderer.getorCreateShader(this.materials[0].shaderSource));
        }
    }
}
