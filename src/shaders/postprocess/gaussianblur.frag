#version 300 es
precision highp float;
precision highp int;

layout(location = 0) out vec4 frag_color;

uniform sampler2D input_texture;

uniform vec2 u_resolution;
uniform float u_blur_factor;

in vec2 tex_coord;

float normpdf(in float x, in float sigma)
{
	return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
}

// https://www.shadertoy.com/view/XdfGDH
void main()
{

    //declare stuff
    const int mSize = 14;
    const int kSize = (mSize-1)/2;
    float kernel[mSize];
    vec3 final_color = vec3(0.0);
    
    //create the 1-D kernel
    float sigma = u_blur_factor;
    float Z = 0.0;
    for (int j = 0; j <= kSize; ++j)
    {
        kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
    }
    
    //get the normalization factor (as the gaussian has been clamped)
    for (int j = 0; j < mSize; ++j)
    {
        Z += kernel[j];
    }
    
    //read out the texels
    for (int i=-kSize; i <= kSize; ++i)
    {
        for (int j=-kSize; j <= kSize; ++j)
        {
            final_color += kernel[kSize+j]*kernel[kSize+i]*texture(input_texture, tex_coord.xy + vec2(float(i),float(j)) / u_resolution.xy) .rgb;
        }
    }
		
	frag_color = vec4(final_color/(Z*Z), 1.0);

}