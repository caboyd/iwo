#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_normal;

void main() {
    frag_color = vec4(view_normal, 1.0);
}

