void main() {
	vec3 posWS = (modelMatrixFrag * vec4(vPosition, 1.0)).xyz;
	vec3 viewVecNorm = normalize(posWS - cameraPosition);

	float stepSize = _stepSize;
	float noiseValue = InterleavedGradientNoise(gl_FragCoord.xy);

	vec3 rayOrigin = vPosition + viewVecNorm * mix(0.0, stepSize, noiseValue);
	vec3 rayDir = viewVecNorm;

	vec3 currentPos = rayOrigin;
	float density = 0.0;
	
	float noiseMask = noise3dvalue(currentPos * _noiseMaskScale * 0.001 + _noiseMaskOffset);
	noiseMask = smoothstep(_noiseMaskSmoothStep.x, _noiseMaskSmoothStep.y, noiseMask);

	float spinOffset = rayDir.y;

	vec3 voronoiOffset = vec3(0.0);
	Unity_RotateAboutAxis_Radians_float(currentPos * 0.01, vec3(0.0,1.0,0.0), _iTime * _noiseStarMaskSpeed, voronoiOffset);
	float starNoiseMask = noise3dvalue(currentPos * 0.06 + noiseMask + voronoiOffset);
	float vn = voronoi(vPosition * _noiseStarScale).x;
	vn = smoothstep(_noiseStarSmoothStep.y, _noiseStarSmoothStep.x, vn) * starNoiseMask;
	vn = clamp(vn, 0.0, 1.0);

	for(int i = 0; i < 15; i++){
		/*vec3 n1Offset = vec3(.0,.0,.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _noise1Scale * 0.001, vec3(0.0,1.0,0.0), _iTime * _noise1Speed + spinOffset * _noise1Screw, n1Offset);
		float n1 = noise3dvalue(currentPos*0.01 + n1Offset);

		vec3 n2Offset = vec3(.0,.0,.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _noise2Scale * 0.001, vec3(0.0,1.0,0.0), _iTime * _noise2Speed + spinOffset * _noise2Screw, n2Offset);
		float n2 = noise3dvalue(currentPos*0.01 + n2Offset + n1 * _noise1Mult);

		vec3 n3Offset = vec3(0.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _mainNoiseScale * 0.001, vec3(0.0,1.0,0.0), spinOffset * _mainNoiseScrew, n3Offset);
		float noiseSample = noise3dvalue(n3Offset + n2 * _noise2Mult);*/

		/*vec3 n1Offset = vec3(.0,.0,.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _noise1Scale * 0.001, vec3(0.0,1.0,0.0), _iTime * _noise1Speed + spinOffset * _noise1Screw, n1Offset);
		float n1 = noise3dvalue(currentPos*0.01 + n1Offset);*/
		
		vec3 n1Offset = vec3(.0,.0,.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _noise1Scale * 0.001, vec3(0.0,1.0,0.0), _iTime * _noise1Speed + spinOffset * _noise1Screw, n1Offset);
		float n1 = 1.0 - voronoi(currentPos*0.01 + n1Offset).x;//voronoi

		vec3 n2Offset = vec3(.0,.0,.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _noise2Scale * 0.001, vec3(0.0,1.0,0.0), _iTime * _noise2Speed + spinOffset * _noise2Screw, n2Offset);
		float n2 = 1.0 - voronoi(currentPos*0.01 + n2Offset).x;

		vec3 n3Offset = vec3(0.0);
		Unity_RotateAboutAxis_Radians_float(currentPos * _mainNoiseScale * 0.001, vec3(0.0,1.0,0.0), spinOffset * _mainNoiseScrew, n3Offset);
		float noiseSample = noise3dvalue(n3Offset) + n1 * _noise1Mult + n2 * _noise2Mult;

		density += noiseSample * _densityMult * noiseMask;
		currentPos += rayDir * stepSize;
	}
	//density = sin(density);
	vec3 c12 = mix(_color0, _color1, clamp(density * 2.0, 0.0, 1.0));
	vec3 c123 = mix(c12, _color2, clamp((density - 0.5) * 2.0, 0.0, 1.0));

	//gl_FragColor = vec4(vec3(vn), 1.0);
	gl_FragColor = vec4(c123 + _colorStars * vn, 1.0);
}