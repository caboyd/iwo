#version 300 es

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

out vec3 local_pos;

void main()
{
    local_pos = a_vertex;

    mat4 rot_view = mat4(mat3(view));
    vec4 clip_pos = projection * rot_view * vec4(local_pos, 1.0);

    gl_Position = clip_pos.xyww;
}