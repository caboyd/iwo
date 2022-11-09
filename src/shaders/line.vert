#version 300 es
precision highp float;

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 point_a;
layout (location = 2) in vec3 point_b;
layout (location = 3) in vec3 color_a;
layout (location = 4) in vec3 color_b;

layout (std140) uniform ubo_per_frame{
// base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 view_inverse;    // 64               // 64
    mat4 projection;      // 64               // 128
    mat4 view_projection; // 64               // 192

};
layout (std140) uniform ubo_per_model{
                          // base alignment   // aligned offset
    mat4 model_view;      // 64               // 0
    mat3 normal_view;     // 48               // 64
    mat4 mvp;             // 64               // 112
};

uniform float width;

out vec3 color;

void main() {
    vec2 x_basis = vec2(point_a) - vec2(point_a);
    vec2 y_basis = normalize(vec2(-x_basis.y, x_basis.x));
    gl_Position = projection * vec4(position, 1);
}