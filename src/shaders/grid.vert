#version 300 es
precision highp float;

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;

//layout (std140) uniform Matrices{
//    mat4 view;
//    mat4 projection;
//    mat4 view_projection;
//};

uniform mat4 u_modelview_matrix;
uniform mat4 u_mvp_matrix;

out vec3 world_pos;
out vec3 view_pos;

void main() {

    vec3 camera_pos =  inverse(u_modelview_matrix)[3].xyz;
    camera_pos.y = 0.0;
    
    world_pos = a_vertex + camera_pos;
    
    gl_Position = u_mvp_matrix * vec4(world_pos,1.0f);

    view_pos = (u_modelview_matrix *  vec4(world_pos,1.0f)).xyz;
}
