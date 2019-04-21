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
    mat4 projection;      // 64               // 64
    mat4 view_projection; // 64               // 128

};

layout (std140) uniform ubo_per_model{
                          // base alignment   // aligned offset
    mat4 model_view;      // 64               // 0
    mat3 normal_view;     // 48               // 64
    mat4 mvp;             // 64               // 112
};

out vec3 local_pos;
out vec3 view_pos;
out vec2 tex_coord;
out vec3 view_normal;

void main() {
    gl_Position = mvp * vec4(a_vertex,1.0f);
    
    local_pos = a_vertex;
    view_pos = (model_view * vec4(a_vertex,1.0f)).xyz ;
    view_normal =  normal_view * a_normal ;
        
    tex_coord = a_tex_coord;
}
