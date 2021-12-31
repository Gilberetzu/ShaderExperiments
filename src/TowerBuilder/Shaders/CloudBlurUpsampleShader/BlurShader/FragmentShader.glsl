varying vec2 fragUV;

uniform sampler2D cloudTex;
uniform float mipLevel;
uniform vec2 texelSize;

void main() {
	vec4 s0 = textureLod(cloudTex, fragUV + texelSize * vec2(0.5,0.5), mipLevel);
	vec4 s1 = textureLod(cloudTex, fragUV + texelSize * vec2(0.5,-0.5), mipLevel);
	vec4 s2 = textureLod(cloudTex, fragUV + texelSize * vec2(-0.5,0.5), mipLevel);
	vec4 s3 = textureLod(cloudTex, fragUV + texelSize * vec2(-0.5,-0.5), mipLevel);

	gl_FragColor = (s0 + s1 + s2 + s3)/4.0;
}