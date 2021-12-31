varying vec2 fUV;
varying vec3 fPosition;
varying vec3 fNormal;
varying float movementMag;
varying mat4 modelMatrixFrag;

uniform sampler2D directionalShadowMap;
uniform mat4 directionalShadowMatrix;
//varying vec4 vDirectionalShadowCoord;
struct DirectionalLightShadow {
	float shadowBias;
	float shadowNormalBias;
	float shadowRadius;
	vec2 shadowMapSize;
};
uniform DirectionalLightShadow directionalLightShadow;

uniform sampler2D cloudShapeTex;
uniform vec3 cloudBoundsMin;
uniform vec3 cloudBoundsMax;
uniform vec3 lightDirection;
uniform float cloudTime;
uniform float cloudCoverage;

float saturate(float a){
	return clamp(a, 0.0,1.0);
}
float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

vec2 rayBoxDst(vec3 bMin, vec3 bMax, vec3 rayOrigin, vec3 rayDir)
{
	vec3 t0 = (bMin - rayOrigin) / rayDir;
	vec3 t1 = (bMax - rayOrigin) / rayDir;

	vec3 tmin = min(t0, t1);
	vec3 tmax = max(t0, t1);

	float dstA = max(max(tmin.x, tmin.y), tmin.z);
	float dstB = min(tmax.x, min(tmax.y, tmax.z));

	float dstToBox = max(0.0,dstA);
	float dstInsideBox = max(0.0, dstB - dstToBox);
	return vec2(dstToBox, dstInsideBox);
}

float getCloudShadow(vec3 positionWS){
	vec2 rayHitInfo = rayBoxDst(cloudBoundsMin, cloudBoundsMax, positionWS.xyz, -lightDirection);
	float cloudSample = 0.0;
	if(rayHitInfo.y > 0.0){
		vec3 hitPosition = positionWS.xyz + (-lightDirection) * rayHitInfo.x;
		cloudSample = texture2D( cloudShapeTex, hitPosition.xz * 0.025 + cloudTime * vec2(0.02,0.02)).x;
		cloudSample = InvLerp(cloudCoverage, 1.0, cloudSample);
		float maskMultiplier = mix(1.0, 2.0, clamp(-cloudCoverage, 0.0,1.0));

		float xMask = 1.0 - abs((clamp(InvLerp(cloudBoundsMin.x, cloudBoundsMax.x, hitPosition.x), 0.0, 1.0) - 0.5)*2.0);
		xMask = sin(saturate(InvLerp(0.05,0.5,xMask)) * 1.57);

		float zMask = 1.0 - abs((clamp(InvLerp(cloudBoundsMin.z, cloudBoundsMax.z, hitPosition.z), 0.0, 1.0) - 0.5)*2.0);
		zMask = sin(saturate(InvLerp(0.05,0.5,zMask)) * 1.57);

		cloudSample = clamp(cloudSample* 1.5 - (1.0 - xMask * zMask * maskMultiplier), 0.0, 1.0);
	}
	return cloudSample;
}

const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
	return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
}

float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
	float shadow = 1.0;
	shadowCoord.xyz /= shadowCoord.w;
	shadowCoord.z += shadowBias;
	// if ( something && something ) breaks ATI OpenGL shader compiler
	// if ( all( something, something ) ) using this instead
	bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
	bool inFrustum = all( inFrustumVec );
	bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
	bool frustumTest = all( frustumTestVec );
	if ( frustumTest ) {
		vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
		float dx = texelSize.x;
		float dy = texelSize.y;
		vec2 uv = shadowCoord.xy;
		vec2 f = fract( uv * shadowMapSize + 0.5 );
		uv -= f * texelSize;
		shadow = (
			texture2DCompare( shadowMap, uv, shadowCoord.z ) +
			texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
			texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
			texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
			mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ), 
					texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					f.x ) +
			mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ), 
					texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					f.x ) +
			mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ), 
					texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					f.y ) +
			mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ), 
					texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					f.y ) +
			mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ), 
						texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						f.x ),
					mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ), 
						texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						f.x ),
					f.y )
		) * ( 1.0 / 9.0 );
	}
	return shadow;
}

void main() {
	vec4 positionWS = modelMatrixFrag * vec4(fPosition, 1.0);
	vec4 shadowCoord = directionalShadowMatrix * (positionWS + vec4(fNormal.xyz * 0.05, 0.0));
	float shadow = getShadow( directionalShadowMap, directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, shadowCoord );

	vec3 color = vec3(0,0,0);
	float material = fUV.x * 8.0;
	if(material < 1.0){
		color = vec3(0.2,0.30,0.15) * mix(1.0, 1.25, fUV.y);
	}else if(material > 5.0 && material < 6.0){
		color = vec3(1.0,0.256,0.09) * mix(0.5, 1.0, sqrt(clamp(material - 5.0, 0.0, 1.0)));
	}else if(material > 6.0){
		color = vec3(0.85,0.1,0.1) * mix(0.5, 1.0, (material - 6.0) / 2.0);
	}
	float highlight = 1.0 - clamp(movementMag / 0.2, 0.0, 1.0);
	highlight *= fUV.y;
	color *= mix(1.0, 1.5, highlight);

	float shadowIntensity = mix(0.6, 1.0, saturate(step(0.5, shadow) - step(0.3, getCloudShadow(positionWS.xyz))));
	vec3 shadowColor = mix(vec3(0.1,0.1,0.35), vec3(1.0), saturate(shadowIntensity));
	color *= shadowColor;

	gl_FragColor = vec4(color, 1.0);
}