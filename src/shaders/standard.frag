#version 300 es
precision highp float;

in vec3 normal;
in vec2 tex_coord;

out vec4 frag_color;

void main() {
    
    vec3 a = normal * 0.5 + 0.5;
    
	frag_color = vec4(a, 1.0);
}
