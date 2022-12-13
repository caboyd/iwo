#version 300 es

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;

out vec2 tex_coord;

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

void main()
{
    tex_coord = a_tex_coord;
    gl_Position = vec4(a_vertex, 1.0);
}