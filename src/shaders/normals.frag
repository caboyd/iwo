#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_normal;
in vec3 world_normal;

void main() {
    frag_color = vec4(world_normal, 1.0);
}

