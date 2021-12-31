#include <packing>

varying vec2 fragUV;

uniform sampler2D colorTexture;
uniform sampler2D dTex;
uniform vec2 texelSize;

uniform mat4 camProjectionInverse;
uniform mat4 camMatrixWorld;

uniform float cameraNear;
uniform float cameraFar;

uniform vec3 camPosition;

uniform int outputState;

float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

vec3 ACESFilm(vec3 x)
{
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}

vec3 filmicToneMapping(vec3 color)
{
	color = max(vec3(0.), color - vec3(0.004));
	color = (color * (6.2 * color + .5)) / (color * (6.2 * color + 1.7) + 0.06);
	return color;
}

vec3 Uncharted2ToneMapping(vec3 color)
{
	float A = 0.15;
	float B = 0.50;
	float C = 0.10;
	float D = 0.20;
	float E = 0.02;
	float F = 0.30;
	float W = 11.2;
	float exposure = 2.;
	color *= exposure;
	color = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
	float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
	color /= white;
	color = pow(color, vec3(1. / 2.2));
	return color;
}

vec3 simpleReinhardToneMapping(vec3 color)
{
	float exposure = 1.5;
	color *= exposure/(1. + color / exposure);
	color = pow(color, vec3(1. / 2.2));
	return color;
}

vec3 whitePreservingLumaBasedReinhardToneMapping(vec3 color)
{
	float white = 2.;
	float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
	float toneMappedLuma = luma * (1. + luma / (white*white)) / (1. + luma);
	color *= toneMappedLuma / luma;
	color = pow(color, vec3(1. / 2.2));
	return color;
}

vec3 RomBinDaHouseToneMapping(vec3 color)
{
    color = exp( -1.0 / ( 2.72*color + 0.15 ) );
	color = pow(color, vec3(1. / 2.2));
	return color;
}

float readDepth( sampler2D depthSampler, vec2 coord ) {
	float fragCoordZ = texture2D( depthSampler, coord ).x;
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}

vec3 ACESFilmicToneMapping( vec3 color ) {
	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ), // transposed from source
		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ), // transposed from source
		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= 1.0 / 0.6;
	color = ACESInputMat * color;
	// Apply RRT and ODT
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	// Clamp to [0, 1]
	return clamp( color, 0.0, 1.0 );
}

float applyLaplaceDepth(sampler2D depthTex, vec2 centerUv){
	float c0 = readDepth( depthTex, centerUv);

	float c1 = readDepth( depthTex, centerUv + vec2(texelSize.x, texelSize.y));
	float c2 = readDepth( depthTex, centerUv + vec2(texelSize.x, 0.0));
	float c3 = readDepth( depthTex, centerUv + vec2(texelSize.x, -texelSize.y));
	float c4 = readDepth( depthTex, centerUv + vec2(0.0, -texelSize.y));
	float c5 = readDepth( depthTex, centerUv + vec2(-texelSize.x, -texelSize.y));
	float c6 = readDepth( depthTex, centerUv + vec2(-texelSize.x, 0.0));
	float c7 = readDepth( depthTex, centerUv + vec2(-texelSize.x, texelSize.y));
	float c8 = readDepth( depthTex, centerUv + vec2(0.0, texelSize.y));

	float laplace = c0 * 8.0 - c1 - c2 - c3 - c4 - c5 - c6 - c7 - c8;
	return laplace;
}

vec3 applyLaplaceOp(sampler2D tex, vec2 centerUv){
	vec3 c0 = texture2D( tex, centerUv).xyz;

	vec3 c1 = texture2D( tex, centerUv + vec2(texelSize.x, texelSize.y)  ).xyz;
	vec3 c2 = texture2D( tex, centerUv + vec2(texelSize.x, 0.0) 		 ).xyz;
	vec3 c3 = texture2D( tex, centerUv + vec2(texelSize.x, -texelSize.y) ).xyz;
	vec3 c4 = texture2D( tex, centerUv + vec2(0.0, -texelSize.y)		 ).xyz;
	vec3 c5 = texture2D( tex, centerUv + vec2(-texelSize.x, -texelSize.y)).xyz;
	vec3 c6 = texture2D( tex, centerUv + vec2(-texelSize.x, 0.0)		 ).xyz;
	vec3 c7 = texture2D( tex, centerUv + vec2(-texelSize.x, texelSize.y) ).xyz;
	vec3 c8 = texture2D( tex, centerUv + vec2(0.0, texelSize.y) 		 ).xyz;

	vec3 laplace = c0 * 8.0 - c1 - c2 - c3 - c4 - c5 - c6 - c7 - c8;
	
	return laplace;
}

vec3 computeViewVector(){
	vec4 viewVector = camProjectionInverse * vec4(
		(fragUV.x - 0.5) * 2.0,
		(fragUV.y - 0.5) * 2.0,
		0.0,
		1.0);
	viewVector = camMatrixWorld* vec4(viewVector.xyz, 0.0);
	return viewVector.xyz;
}

float computeViewZ(){
	float fragCoordZ = texture2D( dTex, fragUV ).x;
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	return viewZ;
}

void main() {
	vec3 cSample = texture2D( colorTexture, fragUV).xyz;

	float depth = readDepth( dTex, fragUV);
	float depthLaplace = applyLaplaceDepth(dTex, fragUV);
	vec3 colorLaplace = applyLaplaceOp(colorTexture, fragUV);
	float edge = 1.0 - clamp(depthLaplace + colorLaplace.x + colorLaplace.y + colorLaplace.z, 0.0, 1.0);

	vec3 colorEdge = clamp(colorLaplace + vec3(depthLaplace,depthLaplace,depthLaplace), 0.0, 1.0);
	vec3 colorEdgeInv = vec3(1.0,1.0,1.0) - colorEdge;

	/*vec3 viewVec = computeViewVector();
	vec3 rayDir = normalize(viewVec);
	float eyeDepth = -computeViewZ() * length(viewVec);
	
	vec3 wsPos = camPosition + rayDir * eyeDepth;
	float hitWater = wsPos.y <= 0.0 ? 1.0 : 0.0;*/

	//gl_FragColor = vec4(ACESFilmicToneMapping(cSample) * edge, 1.0);
	float vignette = length((fragUV - vec2(0.5, 0.5)) * 2.0);
	vignette = clamp(InvLerp(0.4, 1.41, vignette), 0.0, 1.0);
	vignette = vignette * vignette;

	if(outputState == 0){
		gl_FragColor = vec4(mix(cSample, vec3(0.0,0.05,0.15), vignette) * edge, 1.0);
	}else if(outputState == 1){
		//gl_FragColor = vec4(mix(vec3(1.0,1.0,1.0), mix(cSample, vec3(0.0,0.05,0.15), vignette), edge), 1.0);
		gl_FragColor = vec4(colorEdge, 1.0);
	}else if(outputState == 2){
		gl_FragColor = vec4(mix(cSample, vec3(0.0,0.05,0.15), vignette), 1.0);
	}else if(outputState == 3){
		//gl_FragColor = vec4(ACESFilm(cSample) * edge, 1.0);
		gl_FragColor = vec4(vec3(1.0-edge), 1.0);
	}else if(outputState == 4){
		//gl_FragColor = vec4(ACESFilm(cSample) * edge, 1.0);
		gl_FragColor = vec4(vec3(edge), 1.0);
	}
	//gl_FragColor = vec4(mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), hitWater) * edge, 1.0);
	//gl_FragColor = vec4(colorEdge, 1.0);
	//gl_FragColor = vec4(cSample * colorEdgeInv, 1.0);
	//gl_FragColor = vec4(cSample, 1.0);
	//gl_FragColor = vec4(visualizePosition(worldPos), 1.0);
}