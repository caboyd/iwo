#version 300 es
precision highp float;

in vec3 normal;
in vec2 tex_coord;

out vec4 frag_color;

void main() {
    
	frag_color = vec4(normal, 1.0);
}
