#version 300 es
precision highp float;

in vec3 normal;
in vec2 tex_coord;
in vec3 pos;


out vec4 frag_color;

uniform vec3 u_eye_pos;
uniform sampler2D u_albedo;
uniform vec3 u_color;


uniform bool u_active_textures[1];

void main() {
    vec3 color = vec3(1.0);

    if(u_active_textures[0])
        color = texture(u_albedo,tex_coord).rgb;
    else 
        color = u_color;

   	frag_color =vec4( color, 1.0);


}
