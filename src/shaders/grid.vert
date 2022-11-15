#version 300 es
precision highp float;

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;

layout (std140) uniform ubo_per_frame{
                          // base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 view_inverse;    // 64               // 64
    mat4 projection;      // 64               // 128
    mat4 view_projection; // 64               // 192
    mat4 shadow_map_space;// 64               // 256

};

layout (std140) uniform ubo_per_model{
                        // base alignment   // aligned offset
    mat4 model;         // 64               // 0
    mat3 normal_view;        // 64               // 64
    mat4 mvp;           // 64               // 128
};

out vec3 world_pos;
out vec3 view_pos;

void main() {

    vec3 camera_pos =  inverse(view)[3].xyz;
    camera_pos.y = 0.0;
    
    world_pos = a_vertex + camera_pos;
    
    gl_Position = mvp * vec4(world_pos,1.0f);

    view_pos = (view *  vec4(world_pos,1.0f)).xyz;
}
