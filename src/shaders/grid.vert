#version 300 es
precision highp float;

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;

layout (std140) uniform ubo_per_frame{
    vec3 camera;        
    mat4 view;   
    mat4 projection;   
    mat4 shadow_map_space;
};

layout (std140) uniform ubo_per_model{
    mat4 model;       
    mat3 model_inverse;           
};

out vec3 world_pos;
out vec3 view_pos;

void main() {

    vec3 camera_pos =  inverse(view)[3].xyz;
    camera_pos.y = 0.0;
    
    world_pos = a_vertex + camera_pos;
    
    gl_Position = projection * view * model * vec4(world_pos,1.0f);

    view_pos = (view *  vec4(world_pos,1.0f)).xyz;
}
