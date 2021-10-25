float cloudNoise2(vec3 p){
    float screwInterp = (p.y + 0.5) / 2.0; // Create a variable to check what happens when this is done
    vec3 screwedPos = vec3(0,0,0);
    Unity_RotateAboutAxis_Radians_float(p, vec3(0,1,0), screwInterp * _MaxScrewCloud, screwedPos);
    vec3 samplePos = screwedPos * _CloudNoiseGlobalScale;

    vec3 np = vec3(0,0,0);
    Unity_RotateAboutAxis_Radians_float(samplePos, vec3(0,1,0), iTime * _CloudMoveSpeed, np);
	//Unity_RotateAboutAxis_Radians_float(p, vec3(0,1,0), iTime * _CloudMoveSpeed, np);

	float density = noise3dvalue(np * _CloudNoiseScales.x + _CloudNoiseOffset) + noise3dvalue(samplePos * _CloudNoiseScales.y + _CloudNoiseOffset) * _SecondaryNoiseStrength;
	//density = noised(samplePos * _CloudNoiseScales.y + density * _SecondaryNoiseStrength).x;
    return density * _CloudDensityMultiplier + _CloudDensityOffset;
}

float cloudDistanceMask(float dist){
    float cloudMidDist = _CloudMidDistance * 2.0;
    float minHeight = _CloudHalfHeight * 2.0;
    return smoothstep(cloudMidDist - minHeight,cloudMidDist, dist) * smoothstep(cloudMidDist + minHeight, cloudMidDist, dist);
}

float SampleCloudDensity(vec3 p){
    float density = cloudNoise2(p);
    float dist = length(p) * 2.0;
    float heightMask = cloudDistanceMask(dist);
    return density * heightMask;
}

vec3 calcCloudNormal( in vec3 sp ) // for function f(p) // From https://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
{
    const float h = 0.0001; // replace by an appropriate value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*SampleCloudDensity( sp + k.xyy*h ) + 
                      k.yyx*SampleCloudDensity( sp + k.yyx*h ) + 
                      k.yxy*SampleCloudDensity( sp + k.yxy*h ) + 
                      k.xxx*SampleCloudDensity( sp + k.xxx*h ) );
}

void cloudRender(vec3 viewVector, vec3 positionOS, out vec2 lightTransparency, out vec3 hitPos){
    float stepSize = _CloudsStepSize;
    float totalDensity = 0.0;

	float noiseValue = InterleavedGradientNoise(gl_FragCoord.xy);

    vec3 currentPosition = positionOS + viewVector * mix(0.0, stepSize, noiseValue);
    float cloudLightIntensity = -1.0;
	float cloudTransparency = 0.0;

    for(int i = 0; i < int(floor(_CloudsMaxStepCount)); i ++){
        float cDist = length(currentPosition);

        //if(cDist > _BreakDistanceCloud) break; //Exit if outside the sphere
        
        if(cDist < _CloudMidDistance - _CloudHalfHeight){

            vec2 sInter = sphIntersect(currentPosition, viewVector, vec3(0.0,0.0,0.0), _CloudMidDistance - _CloudHalfHeight);
            currentPosition = currentPosition + viewVector * max(sInter.x, sInter.y) * (1.0 + mix(stepSize * 0.3, stepSize * 1.3, noiseValue));
        }
        //if(cDist < _PSWaterHeight) break; //Hit surface

        float cloudSample = clamp(SampleCloudDensity(currentPosition), 0.0, 1.0);
        if(cloudSample > 0.2){
            
            vec3 lColor = vec3(0,0,0);

            vec3 cloudNormal = -calcCloudNormal(currentPosition);
            cloudLightIntensity = clamp(dot(cloudNormal, lDirection), 0.0, 1.0);
			cloudTransparency = 1.0;

            //cloudLightIntensity = float(i) / 200.0;
            break;
        }

        currentPosition += viewVector * stepSize;
    }
    hitPos = currentPosition;
    lightTransparency = vec2(cloudLightIntensity, cloudTransparency);
}

void SampleCloudShadowPlanet(vec3 position, vec3 lightDir,out float lightOcclusion){
    //Considering 
    vec2 intersectionT = sphIntersect(position, lightDir, vec3(0,0,0), _CloudMidDistance);
    float t = intersectionT.x < intersectionT.y ? intersectionT.y : intersectionT.x;
    //float t = intersectionT.y;
    vec3 sampleShadowPos = position + lightDir * t;

    float density = SampleCloudDensity(sampleShadowPos);
    lightOcclusion = 1.0 - smoothstep(0.05, 0.25, density);
}

float distSphere(vec3 samplePos, vec3 spherePos, float sphereRad){
    return length(samplePos - spherePos) - sphereRad;
}

float planetNoise(vec3 pos){
    float cDist = length(pos);
    
    vec3 normPos = normalize(pos);
    float screwInterp = ((pos.y / (_PSMaxHeightOffset + _PSWaterHeight)) + 1.0)/2.0;
    
    //_MaxScrewCloud
    
    vec3 screwedPos = vec3(0.0,0.0,0.0);
    Unity_RotateAboutAxis_Radians_float(normPos, vec3(0.0,1.0,0.0), screwInterp * _MaxScrewTerrain, screwedPos);
    vec3 samplePos = screwedPos * _PSNoiseGlobalScale;
	//float noiseSample = (noised(samplePos * _PSNoiseScales.x).x + noised(samplePos * _PSNoiseScales.y).x * _SecondaryNoiseStrengthGround + _PSDensityOffset);

	float noiseSample = (noise3dvalue(samplePos * _PSNoiseScales.x + _PSNoiseOffset) + noise3dvalue(samplePos * _PSNoiseScales.y + _PSNoiseOffset) * _SecondaryNoiseStrengthGround)/(1.0 + abs(_SecondaryNoiseStrengthGround));
	//noiseSample += _PSDensityOffset;
	//Height map v1
    /*float heightMask = 1.0 - InvLerp(_PSWaterHeight, _PSWaterHeight + _PSMaxHeightOffset, cDist);
    noiseSample = noiseSample * heightMask;
    return mix(noiseSample, 1.0, 1.0 - smoothstep(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight, cDist));*/

	/*float heightMask = 1.0 - smoothstep(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight + _PSMaxHeightOffset, cDist);
    noiseSample = noiseSample + heightMask;
    return noiseSample;*/

	/*float heightMask = 1.1 - InvLerp(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight + _PSMaxHeightOffset, cDist);
    return mix(noiseSample, 1.0 + _PSDensityOffset, heightMask);*/

	vec2 heightLimits = vec2(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight + _PSMaxHeightOffset);

	return noiseSample - InvLerp(min(mix(heightLimits.x, heightLimits.y,_PSDensityOffset),heightLimits.y), heightLimits.y, cDist);
}

//How to create a better 
//float heightMask = 1.0 - smoothstep(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight + _PSMaxHeightOffset, cDist); //1.0 - InvLerp(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight + _PSMaxHeightOffset, cDist);

vec3 calcPlanetNormal( in vec3 sp ) // for function f(p) // From https://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
{
    const float h = 0.0001; // replace by an appropriate value
    const vec2 k = vec2(1.0,-1.0);
    return normalize( k.xyy*planetNoise( sp + k.xyy*h ) + 
                      k.yyx*planetNoise( sp + k.yyx*h ) + 
                      k.yxy*planetNoise( sp + k.yxy*h ) + 
                      k.xxx*planetNoise( sp + k.xxx*h ) );
}

float planetLightOcclusion(vec3 planetSurfacePos){
    float lightOcclusion = 1.0;
	float surfaceHeight = length(planetSurfacePos);
    if(surfaceHeight < _CloudMidDistance){
        SampleCloudShadowPlanet(planetSurfacePos, lDirection, lightOcclusion);
		float occlusionMask = smoothstep(_CloudMidDistance, _CloudMidDistance - 0.1, surfaceHeight);
        lightOcclusion = mix(1.0, lightOcclusion,_CloudTransparency * occlusionMask);
    }
    return lightOcclusion;
}

vec3 getWaterNormal(vec3 rayoriginOS, vec3 viewVector, vec3 surfacePos, bool hitSurface, out vec3 waterHitPosNearOut, out float waterMaterialOut){
    float waterMaterial = 0.0;
    vec2 waterIntersections = sphIntersect(rayoriginOS, viewVector, vec3(0,0,0), _PSWaterHeight);
    vec3 waterHitPosNear = rayoriginOS + viewVector * min(waterIntersections.x, waterIntersections.y);
    waterHitPosNearOut = waterHitPosNear;
    vec3 waterHitPosFar = rayoriginOS + viewVector * max(waterIntersections.x, waterIntersections.y); 

    if(hitSurface){
        waterMaterial = length(surfacePos*100.0 - waterHitPosNear*100.0);
    }else{
        waterMaterial = length(waterHitPosNear*100.0 - waterHitPosFar*100.0);
    }
    waterMaterialOut = waterMaterial;

    vec3 n1 = noised(normalize(waterHitPosNear) * _WaterNormalScale).yzw;
    vec3 rotatedHitPos = vec3(0.0);
    Unity_RotateAboutAxis_Radians_float(waterHitPosNear, vec3(0.0,1.0,0.0), iTime * _WaterMoveSpeed, rotatedHitPos);
    vec3 n2 = noised(normalize(rotatedHitPos) * _WaterNormalScale).yzw;
    
    vec3 waterNormal = normalize( ((n1 + n2) *_WaterNormalStrength / 2.0) + normalize(waterHitPosNear));

    return waterNormal;
}

void planetShading(bool hitSurface, vec3 rayoriginOS, vec3 viewVector, vec3 surfacePos, vec3 highInterpPosition, vec3 newNormal, bool useNewNormal, out vec3 color, out vec3 hitPos){
    
    bool hitWater = false;
	if(_showWater){
		vec2 waterIntersect = sphIntersect(rayoriginOS, viewVector, vec3(0.0), _PSWaterHeight);
		hitWater = waterIntersect.x >= 0.0;
		if(hitWater && hitSurface){//Desambiguating which is closer to the camera
			hitWater = waterIntersect.x < length(surfacePos - rayoriginOS);
		}
	}

    if(!hitWater && !hitSurface){
        color = vec3(-1,0,0);
        hitPos = vec3(0.0);
    }else if(!hitWater && hitSurface){
        vec3 planetNormal = useNewNormal? mix(-calcPlanetNormal(surfacePos), newNormal, _VoxelNormalInterp) : -calcPlanetNormal(surfacePos);
        
        float lightIntensity = mix(_SurfaceMinLight, 1.0, clamp(dot(planetNormal, lDirection), 0.0, 1.0) * planetLightOcclusion(surfacePos));
        
		//prev
		//float hightColorInterp = smoothstep(_PSWaterHeight, _PSWaterHeight + _PSMaxHeightOffset, length(highInterpPosition));
		
		//new
		float height = length(highInterpPosition);
		vec2 heightLimits = vec2(_PSWaterHeight - _PSWaterDepthOffset, _PSWaterHeight + _PSMaxHeightOffset);
		heightLimits.x = mix(heightLimits.x, heightLimits.y, _PlanetHighInterpRange.x);
		heightLimits.y = mix(heightLimits.x, heightLimits.y, _PlanetHighInterpRange.y);
		float hightColorInterp = InvLerp(min(mix(heightLimits.x, heightLimits.y,_PSDensityOffset),heightLimits.y), heightLimits.y, height);
		hightColorInterp = clamp(hightColorInterp, 0.0, 1.0);
        
        color = mix(_PlanetColor1.xyz, _PlanetColor2.xyz, vec3(hightColorInterp)) * lightIntensity;
        hitPos = surfacePos;
    }else if(hitWater){
        vec3 waterHitPosNear = vec3(0.0);
        float waterMaterial = 0.0;
        vec3 waterNormal = getWaterNormal(rayoriginOS, viewVector, surfacePos, hitSurface, waterHitPosNear, waterMaterial);
        float lightOcclusion = planetLightOcclusion(waterHitPosNear);

        waterMaterial = smoothstep(_WaterMaterialSmoothStep.x, _WaterMaterialSmoothStep.y, waterMaterial);
        hitPos = waterHitPosNear;

        float lightIntensity = clamp(dot(waterNormal, lDirection), 0.0, 1.0) * lightOcclusion;
        lightIntensity = mix(clamp(_WaterSurfaceMinLight, 0.0, 1.0),1.0, lightIntensity);

        color = mix(_WaterColorDepth.xyz, _WaterColor.xyz, vec3(waterMaterial)) * lightIntensity;
        
        float waterSpec = specular(-lDirection, waterNormal, viewVector, _SpecularParams);
        color += _WaterSpecularColor * clamp(waterSpec, 0.0, 1.0) * lightIntensity;
    }
}

void VoxelPlanetRender(vec3 viewVector, vec3 positionOS, out vec3 color, out vec3 hitPos){
    //voxelization form inigo quilez
    float gridHalfSize = floor(_GridHalfSize);
    vec3 ro = positionOS * gridHalfSize;
    vec3 pos = floor(ro);
    
    vec3 rd = viewVector;
	vec3 ri = 1.0/rd;
	vec3 rs = sign(rd);
	vec3 dis = (pos-ro + 0.5 + rs*0.5) * ri;
	
	float res = -1.0;
	vec3 mm = vec3(0.0);
	for( int i=0; i<int(floor(_PlanetSurfaceWaterMaxStepCount)); i++ ) 
	{
        float distCenter = length(pos / gridHalfSize);
		if( planetNoise(pos / gridHalfSize) * step(distCenter, _PSWaterHeight + _PSMaxHeightOffset) > 0.0 ) { 
            res=1.0; break; 
        }
		mm = step(dis.xyz, dis.yzx) * step(dis.xyz, dis.zxy);
		dis += mm * rs * ri;
        pos += mm * rs;
	}

	vec3 nor = mix(-mm*rs, calcPlanetNormal(pos / gridHalfSize), 0.01); //-mm*rs;
	vec3 vos = pos;
	
    // intersect the cube	
	vec3 mini = (pos-ro + 0.5 - 0.5*vec3(rs))*ri;
	float t = max ( mini.x, max ( mini.y, mini.z ) );

    //planetShading
    float hitDistance = t*res;
    bool hitSurface = t*res >= 0.0;
    vec3 surfaceHitPosition = (ro + rd * hitDistance) / gridHalfSize;

    planetShading(hitSurface, positionOS, viewVector, surfaceHitPosition, pos/gridHalfSize, nor, true, color, hitPos);
}

void PlanetRenderRaymarch(vec3 viewVector, vec3 positionOS, out vec3 planetColor, out vec3 planetHitPos){

    //Normal ray march
    float stepSize = _PlanetSurfaceWaterStepSize;

    //Sample distance noise
	float noiseValue = InterleavedGradientNoise(gl_FragCoord.xy);
	noiseValue = noiseValue;

    //Starting raymarch position
    vec3 currentPosition = positionOS + viewVector * mix(0.0, stepSize, noiseValue);
    
    vec3 pColor = vec3(-1.0,0.0,0.0);//No initersetction
    bool hitWater = false;
    bool hitSurface = false;

    for(int i = 0; i < int(floor(_PlanetSurfaceWaterMaxStepCount)); i ++){
        float cDist = length(currentPosition);
        
        if(cDist > max(_PSWaterHeight + _PSMaxHeightOffset, _PSWaterHeight + 0.05)) break; //Plannet not hit surface
        
        if(cDist < _PSWaterHeight && !hitWater){
            hitWater = true;
        }

        float planetSample = planetNoise(currentPosition);
            
        if(planetSample > 0.0){//if(planetSample > 0.5){//if(planetSample > 0.1){
            hitSurface = true;
            break;
        }

        currentPosition += viewVector * stepSize;
    }

	planetShading(hitSurface, positionOS, viewVector, currentPosition, currentPosition, vec3(0.0), false, planetColor, planetHitPos);
}

void main() {
	vec3 posWS = (modelMatrixFrag * vec4(vPosition, 1.0)).xyz;
	vec3 viewVecNorm = normalize(posWS - cameraPosition);
	
	/*vec3 unscaledCameraPosOS = cameraPosition - posWS;
	vec3 cameraPosOS = unscaledCameraPosOS / modelMatrixFrag[0].x;
	
	float isFrontFace = -dot(viewVecNorm, vNormal); // if < 0.0 backface else front face
	float deltaDistance = length(cameraPosOS) - 1.1; // if deltaDistance > 0.0 outside else inside*/

	vec3 rayStart = vPosition;

    vec2 sInter = sphIntersect(rayStart, viewVecNorm, vec3(0,0,0), max(_PSWaterHeight + _PSMaxHeightOffset, _PSWaterHeight));
    bool hitPlanet = sInter.x >= 0.0;
    
    vec2 cloudlightTransparency;
    vec3 cloudHitPos;
	if(_CloudTransparency > 0.001 && _CloudHalfHeight > 0.001){
		cloudRender(viewVecNorm, rayStart, cloudlightTransparency, cloudHitPos);
	}else{
		cloudlightTransparency = vec2(-1.0);
		cloudHitPos = vec3(0.0);
	}
    bool cloudHit = cloudlightTransparency.x < 0.0 ? false : true;

    float posterizedCloudInterp = _CloudsPosterize && _CloudsPosterizeCount >=2.0 ? floor(cloudlightTransparency.x * _CloudsPosterizeCount) /(_CloudsPosterizeCount - 1.0) : cloudlightTransparency.x;
    float cloudPlanetOclussion = 1.0;
    
    if(cloudHit){
        vec2 cloudPlanetInt = vec2(0.0);//sphIntersect(cloudHitPos, lDirection, vec3(0,0,0), _PSWaterHeight + _PSMaxHeightOffset);
		vec2 cloudPlanetInt2 = sphIntersect(cloudHitPos, lDirection, vec3(0,0,0), _PSWaterHeight);
        cloudPlanetOclussion = (cloudPlanetInt.x > 0.0 || cloudPlanetInt2.x > 0.0) ? 0.0 : 1.0;
    }
    vec3 fCloudColor = mix(_CloudColor1, _CloudColor2, vec3(posterizedCloudInterp) * cloudPlanetOclussion);

    vec2 atmosphereIntersec = sphIntersect(rayStart, viewVecNorm, vec3(0,0,0), 1.0);
    float atmosphereDepth = 0.0;

    /*if(!hitPlanet){
        vec3 fColor = (cloudInterp < 0.0 ? vec3(0.0) : fCloudColor * _CloudTransparency) + _AmbientColor * atmosphereDepth;
        float fAlpha = cloudInterp < 0.0 ? atmosphereIntersec.y : max(atmosphereIntersec.y, _CloudTransparency) ;
        gl_FragColor = vec4(fColor, fAlpha);//cloudHit ? vec4(fCloudColor,1) : vec4(0.0);
    }else{*/

	vec3 planetInterPoint = rayStart + viewVecNorm * sInter.x;
	vec3 rpColor = vec3(0,0,0);
	vec3 planetHitPos = vec3(0,0,0);

	if(_EnableVoxelizer){
		VoxelPlanetRender(viewVecNorm, rayStart, rpColor, planetHitPos);
	}else{
		PlanetRenderRaymarch(viewVecNorm, planetInterPoint, rpColor, planetHitPos);
	}

	vec3 fColor = vec3(0.0);
	float fAlpha = 0.0;

	float intersectDelta = atmosphereIntersec.y - atmosphereIntersec.x;
	if(rpColor.x < 0.0){
		if(cloudHit){
			atmosphereDepth = mix(intersectDelta, length(rayStart - cloudHitPos), _CloudTransparency);
		}else{
			atmosphereDepth = intersectDelta;
		}
		atmosphereDepth = clamp(pow(atmosphereDepth,2.0) * _AmbientPower, 0.0, 1.0) * 0.75;

		if(cloudHit){
			fColor = (cloudlightTransparency.x < 0.0 ? vec3(0.0) : fCloudColor * _CloudTransparency * cloudlightTransparency.y) + _AmbientColor * atmosphereDepth;
		}else{
			fColor = _AmbientColor;
		}
		fAlpha = cloudlightTransparency.x < 0.0 ? atmosphereDepth : max(atmosphereDepth, _CloudTransparency * cloudlightTransparency.y) ;
	}else{
		vec3 vToPlanet = planetHitPos - rayStart;
		vec3 vToCloud = cloudHitPos - rayStart;

		bool cloudIsNearest = !(cloudlightTransparency.x < 0.0 || dot(vToPlanet, vToPlanet) < dot(vToCloud, vToCloud));
		
		vec3 nearestPosition = cloudIsNearest ? cloudHitPos : planetHitPos;
		
		atmosphereDepth = length(rayStart - nearestPosition);
		if(cloudIsNearest){
			atmosphereDepth = mix(length(rayStart - planetHitPos), atmosphereDepth, _CloudTransparency);
		}

		atmosphereDepth = clamp(pow(atmosphereDepth,2.0) * _AmbientPower, 0.0, 1.0) * 0.75;

		float nearTransparency = 1.0;
		if(cloudHit){
			float distanceToPlanet = length(cloudHitPos - planetHitPos);
			nearTransparency = smoothstep(0.0, 0.1, distanceToPlanet);
		}
		fColor = cloudIsNearest ? mix(rpColor, fCloudColor, _CloudTransparency * cloudlightTransparency.y * nearTransparency) : rpColor;
		fColor = clamp(fColor, vec3(0.0), vec3(1.0)) + _AmbientColor * atmosphereDepth;
		fAlpha = 1.0;
	}

	gl_FragColor = vec4(fColor, fAlpha);
    //}
}