const float _stepSize = 0.01;

float InvLerp(float a, float b, float v){
    return (v - a) / (b - a);
}

float sminCubic( float a, float b, float k )//from inigo quilez https://iquilezles.org/www/articles/smin/smin.htm
{
    float h = max( k-abs(a-b), 0.0 )/k;
    return min( a, b ) - h*h*h*k*(1.0/6.0);
}

float saturate(float x) {
	return clamp(x, 0.0, 1.0);
}

float starNoise(vec3 p){
	float dist = length(p);

	float heightMask = InvLerp(_heightMaskInvLerp.y, _heightMaskInvLerp.x, dist) - 0.5; // height mask inv lerp || vector 2
	float heightMaskRotation = InvLerp(_heightMask.x, _heightMask.y, dist); // height mask rotaiton || vector 2
	
	float speed = _expansionSpeed; //expansion speed || float
	float scale = _expansionScale - saturate(heightMaskRotation) * _expansionScaleHeightOffset;
	// scale || float
	// scale height offset || float 

	float scaledTime = _iTime * speed;
	float flowDistance = _expansionDistance; //flow distance || float

	float mod1 = fract(scaledTime);
	float mod2 = fract(scaledTime - 0.5);
	
	vec3 voroP1 = p * scale - normalize(p) * mod1 * flowDistance;
	vec3 voroP2 = p * scale - normalize(p) * mod2 * flowDistance;

	vec3 rotP1 = vec3(0.0);
	float rot1 = -mod1 + p.y*_screwInterpMultiplier + saturate(heightMaskRotation)* _screwHeightMaskMultiplier; //screw Height mask multiplier || float
	// screw interp mult || float
	Unity_RotateAboutAxis_Radians_float(voroP1, vec3(0.0,1.0,0.0), rot1 * _screwMultiplier, rotP1); //rot multiplier || float

	vec3 rotP2 = vec3(0.0);
	float rot2 = -mod2 + p.y*_screwInterpMultiplier + saturate(heightMaskRotation)* _screwHeightMaskMultiplier;
	Unity_RotateAboutAxis_Radians_float(voroP2, vec3(0.0,1.0,0.0), rot2 * _screwMultiplier, rotP2);

	vec3 voroS1 = voronoi(p*_voronoiScale); //voronoi scale || float

	float mixParam = abs((mod1 - 0.5) * 2.0);
	float per1 = noise3dvalue(rotP1);
	per1 = noise3dvalue(per1 + rotP1 * _noiseSample2Scale); //secondary noise sample scale || 0.5
	float per2 = noise3dvalue(rotP2);
	per2 = noise3dvalue(per2 + rotP2 * _noiseSample2Scale);
	float perlin = (mix(per1, per2, mixParam) - (1.0 - voroS1.x)) + heightMask;

	return perlin;//sminCubic(voro, perlin, 0.5);
}

vec3 calcStarNormal( in vec3 sp ) // for function f(p) // From https://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
{
    const float h = 0.0001; // replace by an appropriate value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*starNoise( sp + k.xyy*h ) + 
                      k.yyx*starNoise( sp + k.yyx*h ) + 
                      k.yxy*starNoise( sp + k.yxy*h ) + 
                      k.xxx*starNoise( sp + k.xxx*h ) );
}

float fresnel(vec3 normal, vec3 viewDir, float power){
	return pow((1.0 - saturate(dot(normalize(normal), normalize(viewDir)))), power);
}

vec3 mainStarColor(vec3 hitPos, vec3 rayDir){
	vec3 mainBodyNormal = normalize(hitPos);
	float mainFresnel = fresnel(-mainBodyNormal, rayDir, _fresnelPower); //fresnel power || float
	mainFresnel = smoothstep(_fresnelRemap.x, _fresnelRemap.y, mainFresnel); // fresnel remap || vector 2
	vec3 mainBodyColor = mix(_color1, _color2, 1.0 - mainFresnel);
	//color 1 || vec3
	//color 2 || vec3
	return mainBodyColor;
}

void main() {
    vec3 posWS = (modelMatrixFrag * vec4(vPosition, 1.0)).xyz;
    vec3 viewVecNorm = normalize(posWS - cameraPosition);

	float stepSize = _stepSize;
	vec3 rayDir = viewVecNorm;
	float interleavedNoise = InterleavedGradientNoise(gl_FragCoord.xy);
	vec3 rayOrigin = vPosition + viewVecNorm * mix(0.0, stepSize, interleavedNoise);

	vec3 currentPos = rayOrigin;
	
	vec3 starColor = vec3(0.0,0.0,0.0);
	bool hitStar = false;
	vec3 hitFirePosition = vec3(0.0);

	float innerBodyRadius = _radius; //Star radius

	bool breakHitPlanet = false;
	
	for(int i = 0; i < 128; i++){
		if(length(currentPos) <= innerBodyRadius) break;
		float noiseSample = starNoise(currentPos);
		if(noiseSample > 0.0){
			//vec3 normal = calcStarNormal(currentPos);
			//float fval = fresnel(normal, rayDir, 1.0);
			//fval = smoothstep(0.0, 1.0, fval);
			//starColor = mix(vec3(1.0,1.0,0.1) , vec3(1.0,1.0,1.0), 1.0 - fval);
			float density = 0.0;
			hitFirePosition = currentPos;
			for(int j = 0; j < 15; j++){
				if(length(currentPos) <= innerBodyRadius){
					breakHitPlanet = true;
					break;
				}
				density += saturate(starNoise(currentPos)) * _densityMultiplier;//density multiplier || float
				currentPos += rayDir * stepSize;
				starColor = vec3(density, density, density);

				if(density > 1.0) break;
			}
			hitStar = true;
			break;
		}
		currentPos += rayDir * stepSize;
	}

	vec2 mainStarBody = sphIntersect(rayOrigin, rayDir, vec3(0.0,0.0,0.0), innerBodyRadius);
	bool hitMainBody = mainStarBody.x > 0.0;

	vec3 mainBodyHitPos = rayOrigin + rayDir * mainStarBody.x;
	/*vec3 mainBodyNormal = normalize(mainBodyHitPos);
	float mainFresnel = fresnel(-mainBodyNormal, rayDir, 2.5);
	mainFresnel = smoothstep(0.0, 0.5, mainFresnel);*/
	vec3 mainBodyColor = mainStarColor(mainBodyHitPos, rayDir);

	float fireGradient = smoothstep(innerBodyRadius, _fireRemapMax, length(hitFirePosition)); //Star Fire Height Color Remap
	vec3 fColor = mix(mainStarColor(hitFirePosition, rayDir), _fireColor, fireGradient); //Star outer color

	vec2 sInter = sphIntersect(rayOrigin, rayDir, vec3(0.0,0.0,0.0), 0.95);
	bool hit = sInter.x >= 0.0;
	float outerParam = hit? pow(abs(sInter.x - sInter.y) / 2.0, _outerLightPower) : 0.0; //Outer light power
	
	//mainBodyColor
	vec3 bgColor = hitMainBody ? mainBodyColor : _outerColor; //* outerParam; // Outer color
	vec3 fireColor = hitStar && !breakHitPlanet ? fColor: bgColor;
	vec3 color = mix(fireColor, fColor, starColor.x);
	
	float transparency = hitMainBody || hitStar ? 1.0 : hit ? outerParam : 0.0; 
	gl_FragColor = vec4(color, transparency);
}