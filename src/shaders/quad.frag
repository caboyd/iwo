#version 300 es
precision mediump  float;
// Ouput data
layout(location = 0) out vec4 color;

uniform sampler2D input_texture;

in vec2 tex_coord;

void main()
{
	color = texture(input_texture, tex_coord);
}