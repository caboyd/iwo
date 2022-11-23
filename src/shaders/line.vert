#version 300 es
precision highp float;

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 point_a;
layout (location = 2) in vec3 point_b;
layout (location = 3) in vec3 color_a;
layout (location = 4) in vec3 color_b;

layout (std140) uniform ubo_per_model{
                        // base alignment   // aligned offset
    mat4 model;         // 64               // 0
    mat3 normal_view;        // 64               // 64
    mat4 mvp;           // 64               // 128
};

uniform float width;
uniform vec2 resolution;
uniform bool world_space;
out vec3 o_color;

void main() {

    vec4 clip0 = mvp * vec4(point_a, 1.0);
    vec4 clip1 = mvp * vec4(point_b, 1.0);

    vec2 screen0 = resolution * (0.5 * clip0.xy/clip0.w + 0.5);
    vec2 screen1 = resolution * (0.5 * clip1.xy/clip1.w + 0.5);

    vec2 x_basis = normalize(screen1 - screen0);
    vec2 y_basis = vec2(-x_basis.y, x_basis.x);

    float w = width;
    if(world_space)
    {
        vec4 pos = mix(clip0,clip1,position.z);
        w = width / pos.w;
    }

    vec2 pt0 = screen0 + w * (position.x * x_basis + position.y * y_basis);
    vec2 pt1 = screen1 + w * ( position.x * x_basis + position.y * y_basis);
    vec2 pt = mix(pt0, pt1, position.z);

    vec4 clip2 = mix(clip0, clip1, position.z);

    gl_Position =  vec4(clip2.w * ((2.0 * pt) / resolution - 1.0), clip2.z, clip2.w);
 

}