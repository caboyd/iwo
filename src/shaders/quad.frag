#version 300 es
precision mediump  float;
// Ouput data
layout(location = 0) out vec4 color;

uniform sampler2D texture1;

in vec2 tex_coord;

void main()
{
	float depth = texture(texture1, tex_coord).r;
	color = texture(texture1, tex_coord);
}