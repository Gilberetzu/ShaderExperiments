#include <packing>
precision mediump sampler3D;

varying vec2 fragUV;
uniform sampler2D dTex;
uniform sampler3D voronoiTex;

uniform mat4 camProjectionInverse;
uniform mat4 camMatrixWorld;

uniform float cameraNear;
uniform float cameraFar;

uniform vec3 camPosition;

uniform vec3 boundsMin;
uniform vec3 boundsMax;

uniform int maxStepCount;
uniform int maxStepCountSun;

uniform float stepSize;
uniform float stepSizeSun;

uniform float densityMultiplier;
uniform float densityMultiplierSun;

uniform float depthBias;
uniform vec3 lightDirection;
uniform float scatteringConstant;
uniform sampler2D shapeNoise;

uniform float time;

float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

float InterleavedGradientNoise(vec2 screnPos){
	vec3 magic = vec3( 0.06711056, 0.00583715, 52.9829189 );
	return fract( magic.z * fract( dot( screnPos, magic.xy ) ) );
}

float saturate(float a){
	return clamp(a, 0.0,1.0);
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

vec3 computeWorldPosition(){
	// Convert screen coordinates to normalized device coordinates (NDC)
	float viewZ = computeViewZ();
	
	vec3 viewVector = computeViewVector();
	
	return (viewVector.xyz * viewZ - camPosition);
}

vec3 visualizePosition(in vec3 pos){
	float grid = 5.0;
	float width = 3.0;
	
	pos *= grid;
	
	// Detect borders with using derivatives.
	vec3 fw = fwidth(pos);
	vec3 bc = clamp(width - abs(1.0 - 2.0 * fract(pos)) / fw, 0.0, 1.0);
	
	// Frequency filter
	vec3 f1 = smoothstep(1.0 / grid, 2.0 / grid, fw);
	vec3 f2 = smoothstep(2.0 / grid, 4.0 / grid, fw);
	
	bc = mix(mix(bc, vec3(0.5), f1), vec3(0.0), f2);
	
	return bc;
}

float hg(float angle) {
	float g = scatteringConstant;
	float g2 = g*g;
	return (1.0-g2) / (4.0*3.1415*pow(1.0+g2-2.0*g*(angle), 1.5));
}

float sceneDensity(vec3 pointCheck){
	float linearHeight = clamp(InvLerp(boundsMin.y, boundsMax.y, pointCheck.y), 0.0, 1.0);
	float heightRamp = (1.0 - clamp(InvLerp(0.1, 1.0, linearHeight), 0.0, 1.0)) * (1.0 - clamp(InvLerp(0.1, 0.0, linearHeight), 0.0, 1.0));

	float xMask = 1.0 - abs((clamp(InvLerp(boundsMin.x, boundsMax.x, pointCheck.x), 0.0, 1.0) - 0.5)*2.0);
	xMask = sin(saturate(InvLerp(0.05,0.5,xMask)) * 1.57);

	float zMask = 1.0 - abs((clamp(InvLerp(boundsMin.z, boundsMax.z, pointCheck.z), 0.0, 1.0) - 0.5)*2.0);
	zMask = sin(saturate(InvLerp(0.05,0.5,zMask)) * 1.57);
	
	float shapeSample = texture2D( shapeNoise, pointCheck.xz * 0.025 + time * vec2(0.02,0.02)).x * 2.0;
	
	if(shapeSample > 0.0){
		float voronoiSample = texture(voronoiTex, pointCheck * 0.1).r * 0.2 + texture(voronoiTex, pointCheck * 0.25).r * 0.25;
		shapeSample = shapeSample - (1.0 - heightRamp * xMask * zMask) - voronoiSample;
	}
	
	return shapeSample;
}

float densityTowardsSun(vec3 p){
	vec3 rayOrigin = p;

	vec3 dirTowardsSun = -lightDirection;
	vec2 rayInfo = rayBoxDst(boundsMin, boundsMax, rayOrigin, dirTowardsSun);
	bool rayHitBox = rayInfo.y > 0.0;
	float density = 0.0;

	if(rayHitBox){
		float currentDistance = rayInfo.x;
		
		float stepSize_sun = rayInfo.y / float(maxStepCountSun);

		for (int i = 0; i < maxStepCountSun ; i++)
		{
			currentDistance += stepSize_sun;
			vec3 pointCheck = rayOrigin + dirTowardsSun * currentDistance;

			float densityPoint = saturate(sceneDensity(pointCheck)) * stepSize_sun;

			density += densityPoint * 4.0;// densityMultiplierSun;

			/*if (density >= 1) {
				density = 1;
				break;
			}*/

			//Break if it is outside the boox
			if (currentDistance > rayInfo.x + rayInfo.y) {
				break;
			}
		}
	}

	return density;
}

/*vec3 calcSceneNormal( in vec3 sp ) // for function f(p) // From https://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
{
    const float h = 0.01; // replace by an appropriate value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*sceneDensity( sp + k.xyy*h ) + 
                      k.yyx*sceneDensity( sp + k.yyx*h ) + 
                      k.yxy*sceneDensity( sp + k.yxy*h ) + 
                      k.xxx*sceneDensity( sp + k.xxx*h ) );
}*/

vec3 calcSceneNormal( in vec3 p ) // for function f(p)
{
    const float eps = 0.001; // or some other value
    const vec2 h = vec2(eps,0);
    return normalize( vec3(sceneDensity(p+h.xyy) - sceneDensity(p-h.xyy),
                           sceneDensity(p+h.yxy) - sceneDensity(p-h.yxy),
                           sceneDensity(p+h.yyx) - sceneDensity(p-h.yyx) ) );
}

void main() {
	vec3 viewVec = computeViewVector();
	vec3 rayDir = normalize(viewVec);
	vec3 rayOrigin = camPosition;
	vec2 rayInfo = rayBoxDst(boundsMin, boundsMax, rayOrigin, rayDir);
	float eyeDepth = -computeViewZ() * length(viewVec);

	float box = 0.0;
	vec4 cloudColor = vec4(0,0,0,0);
	if(rayInfo.x < eyeDepth){
		bool rayHitBox = rayInfo.y > 0.0;
		if(rayHitBox){
			
			float lightIntensity = 1.0;
			float sunDensitySamples = 0.0;
			
			vec3 pointCheck;
			float pointDensity;

			float angleLightView = dot(rayDir, -lightDirection);
			float henyeyLaw = hg(angleLightView);

			//rayDir.xy
			float sampleNoise = InterleavedGradientNoise(vec2(abs(gl_FragCoord.x), abs(gl_FragCoord.y)));
			float displacementNoise = stepSize * (mix(-1.0, 1.0, sampleNoise));
			//float stepSizeMultInterpolator = 0;

			float currentDistance = rayInfo.x + displacementNoise;
			float stepsTaken = 0.0;
			float densityOverCameraRay = 0.0;

			float isoSurface = 0.0;
			vec3 isoNormal = vec3(0,0,0);

			for (int i = 0; i < maxStepCount; i++)
			{
				stepsTaken += 1.0;
				pointCheck = rayOrigin + rayDir * currentDistance;//This is a world space position

				pointDensity = saturate(sceneDensity(pointCheck)) * 2.5;

				densityOverCameraRay += pointDensity * stepSize ;
				
				/*if(pointDensity > 0.0){
					isoSurface = 1.0;
					isoNormal = calcSceneNormal(pointCheck);
					break;
				}*/

				if(pointDensity > 0.0){
					//stepSizeMultInterpolator < 0.8
					float densityToSun = densityTowardsSun(pointCheck);
					sunDensitySamples += (densityToSun * pointDensity * stepSize) * 1.0;
				}

				if(sunDensitySamples > 1.0){
					break;
				}

				if (currentDistance > eyeDepth + depthBias || currentDistance > rayInfo.x + rayInfo.y) {
					break;
				}

				currentDistance += stepSize;
			}

			float beerLaw = exp(-sunDensitySamples * 0.5);
			float powderLaw = 1.0;// 1.0 - exp(-densityOverCameraRay * 2.0);
			
			float lightEnergy = beerLaw + clamp(henyeyLaw * 1.0, 0.0, 1.0) * exp(-densityOverCameraRay * 0.5);
			//lightEnergy *= densityOverCameraRay;

			//lightEnergy = clamp(lightEnergy, 0.0, 1.0);
			vec3 lightColor = vec3(0.8, 0.9, 0.9);
			vec3 darkColor = vec3(0.3,0.5,0.8);

			//vec3 lightColor = vec3(1.0, 0.0, 0.0);
			//vec3 darkColor = vec3(0.0,1.0,0.0);

			vec3 cColor = mix(darkColor,lightColor,lightEnergy);
			cloudColor = vec4(cColor,clamp(densityOverCameraRay, 0.0, 1.0));

			//float isoSurfaceLight = dot(isoNormal, lightDirection);
			//cloudColor = vec4(mix(darkColor,lightColor,isoSurfaceLight), isoSurface);
		}
	}

	gl_FragColor = cloudColor;
}

