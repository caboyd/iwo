import { Mesh } from "./Mesh";
import { Material } from "src/materials/Material";
import {mat3, mat4} from "gl-matrix";
import {Renderer} from "../graphics/Renderer";
import {Shader} from "../graphics/Shader";

export class MeshInstance {
    mesh: Mesh;
    materials: Material[] | Material;

    model_matrix:mat4;
    normal_matrix:mat3;
    
    constructor(mesh: Mesh, materials: Material[] | Material) {
        this.mesh = mesh;
        this.materials = materials;
        
        this.model_matrix = mat4.create();
        this.normal_matrix = mat3.create();
    }
    
    
    render(gl:WebGL2RenderingContext,renderer:Renderer, view_matrix:mat4, proj_matrix:mat4){
        let shader:Shader;
               
        if(Array.isArray(this.materials)){
            for(let i of this.materials.keys()){
                let mat = this.materials[i];
                shader = mat.shader;
                shader.use();
                //TODO: add uniforms blocks so this can be shared between shaders
                shader.setModelViewBlock(this.model_matrix,this.normal_matrix,view_matrix,proj_matrix);
                
                mat.activate(gl);
                for(let submesh of this.mesh.sub_meshes){
                    if(submesh.material_index === i)
                        renderer.draw(this.mesh.draw_mode,submesh.count,submesh.offset,submesh.index_buffer,submesh.vertex_buffer, shader);
                }
            }
        }else{
            shader = this.materials.shader;
            shader.use();
            //TODO: add uniforms blocks so this can be shared between shaders
            shader.setModelViewBlock(this.model_matrix,this.normal_matrix,view_matrix,proj_matrix);
            
            this.materials.activate(gl);
            renderer.draw(this.mesh.draw_mode,this.mesh.count,0,this.mesh.index_buffer,this.mesh.vertex_buffer, shader);
        }
    }
}
