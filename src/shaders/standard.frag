#version 300 es
precision highp float;

in vec3 normal;
in vec2 tex_coord;

out vec4 frag_color;

uniform sampler2D albedo;

void main() {
    vec3 color = mix(normal, texture(albedo,tex_coord).rgb, 0.6);
    
	frag_color =vec4( color, 1.0);
}
