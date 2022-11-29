#version 300 es
precision highp float;
// Ouput data
layout(location = 0) out vec4 frag_color;

uniform sampler2D input_texture;
uniform float gamma;

in vec2 tex_coord;

void main()
{
	vec4 color = texture(input_texture, tex_coord).rgba;

    vec3 color3 = color.rgb;
    //Reinhard HDR correction
    color3 = color3 / (color3 + vec3(1.0));
    //Gamma correction
    float g = gamma;
    if(g < 0.0001) g = 2.2;
    color3 = pow(color3, vec3(1.0/g));

    frag_color = vec4(color3, color.a);
}