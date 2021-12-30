varying vec2 fragUV;

uniform sampler2D cloudTex;
uniform float mipLevel;

void main() {
	vec4 s = textureLod(cloudTex, fragUV, mipLevel);
	gl_FragColor = s;
}