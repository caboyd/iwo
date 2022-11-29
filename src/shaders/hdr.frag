#version 300 es
precision highp float;
// Ouput data
layout(location = 0) out vec4 frag_color;

uniform sampler2D input_texture;
uniform float gamma;
uniform float exposure;
uniform int hdr_type;

in vec2 tex_coord;

vec3 aces(vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 gammaCorrect(vec3 mapped_color){
    float g = gamma;
    g = max(g, 0.0001);
    return pow(mapped_color, vec3(1.0 / g));
}

void main()
{
	vec4 hdr_color = texture(input_texture, tex_coord).rgba;

    vec3 mapped_color = hdr_color.rgb;

    switch(hdr_type){
        case 0:
            //Reinhard tonemapping
            mapped_color = mapped_color / (mapped_color + vec3(1.0));
            mapped_color = gammaCorrect(mapped_color);
            break;
        case 1:
            //Reinhard2 tonemapping
            const float L_white = 4.0;
            mapped_color = (mapped_color * (1.0 + mapped_color / (L_white * L_white))) / (1.0 + mapped_color);
            mapped_color = gammaCorrect(mapped_color);
            break;
        
        case 2:
            // Lottes 2016, "Advanced Techniques and Optimization of HDR Color Pipelines"
            const float a = 1.6;
            const float d = 0.977;
            const float hdrMax = 8.0;
            const float midIn = 0.18;
            const float midOut = 0.267;
            // Can be precomputed
            const float b =
                (-pow(midIn, a) + pow(hdrMax, a) * midOut) /
                ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);
            const float c =
                (pow(hdrMax, a * d) * pow(midIn, a) - pow(hdrMax, a) * pow(midIn, a * d) * midOut) /
                ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);

            mapped_color = pow(mapped_color, vec3(a)) / (pow(mapped_color, vec3(a * d)) * b + c);
            mapped_color = gammaCorrect(mapped_color);
            break;
        
        case 3:
            //ACES tonemapping
            mapped_color = aces(mapped_color);
            mapped_color = gammaCorrect(mapped_color);
        
        case 4:
            //Exposure tonemapping
            mapped_color = vec3(1.0) - exp(-mapped_color * exposure);
            mapped_color = gammaCorrect(mapped_color);
            break;
        case 5:
            //Unreal gamma baked in
            mapped_color = mapped_color / (mapped_color + 0.155) * 1.019;
    }


    frag_color = vec4(mapped_color, hdr_color.a);
}