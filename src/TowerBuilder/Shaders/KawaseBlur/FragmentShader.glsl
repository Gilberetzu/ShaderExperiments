varying vec2 fragUV;

uniform sampler2D colorTexture;
uniform float windowSize;
uniform float mulOffset;
uniform vec2 texelSize;

vec4 regionAverage(vec2 moveSize, vec2 xRegion, vec2 yRegion, vec2 uv, sampler2D texSampler){
	vec4 acumulator = vec4(0.0,0.0,0.0,0.0);
	float itterations = 0.0;
	for(int i = int(xRegion.x); i <= int(xRegion.y); i++){
		for(int j = int(yRegion.x); j <= int(yRegion.y); j++){
			vec2 uvOffset = vec2(float(i) * moveSize.x, float(j) * moveSize.y);
			vec2 newUv = uv + uvOffset * mulOffset;
			acumulator += texture2D(texSampler, newUv);
			itterations++;
		}
	}
	return acumulator / itterations;
}

vec4 regionStandardDeviation(vec2 moveSize, vec2 xRegion, vec2 yRegion, vec2 uv, sampler2D texSampler, vec4 average){
	vec4 acumulator = vec4(0.0,0.0,0.0,0.0);
	float itterations = 0.0;
	for(int i = int(xRegion.x); i <= int(xRegion.y); i++){
		for(int j = int(yRegion.x); j <= int(yRegion.y); j++){
			vec2 uvOffset = vec2(float(i) * moveSize.x, float(j) * moveSize.y);
			vec2 newUv = uv + uvOffset * mulOffset;
			acumulator += pow(texture2D(texSampler, newUv) - average, vec4(2.0,2.0,2.0,2.0));
			itterations++;
		}
	}
	return acumulator / itterations;
}

ivec4 SelectAverages(mat4 deviations){
	//This is going to select in which region the minimun deviation is found for each rgba value individualy
	//The values in the minDeviationLocation represent the regions in wich the minimun deviation for the r value is found and so on
	ivec4 minDeviationRegion = ivec4(0,0,0,0);
	
	for(int j = 0; j < 4; j++){    
		for(int i = 1; i < 4; i++){
			if(deviations[i][j] < deviations[minDeviationRegion[j]][j]){
				minDeviationRegion[j] = i;
			}
		}
	}

	return minDeviationRegion;
}

vec4 KawaharaFilter(vec2 uv, sampler2D texSampler){
	vec2 moveSize = texelSize;
	mat4 averages;
	mat4 deviations;

	//region1
	vec2 r1X = vec2(0.0, windowSize);
	vec2 r1Y = vec2(0.0, windowSize);
	averages[0] = regionAverage(            moveSize, r1X, r1Y, uv, texSampler);
	deviations[0] = regionStandardDeviation(  moveSize, r1X, r1Y, uv, texSampler, averages[0]);

	//region2
	vec2 r2X = vec2(-windowSize, 0.0);
	vec2 r2Y = vec2(0.0, windowSize);
	averages[1] = regionAverage(            moveSize, r2X, r2Y, uv, texSampler);
	deviations[1] = regionStandardDeviation(  moveSize, r2X, r2Y, uv, texSampler, averages[1]);

	//region3
	vec2 r3X = vec2(-windowSize, 0.0);
	vec2 r3Y = vec2(-windowSize, 0.0);
	averages[2] = regionAverage(            moveSize, r3X, r3Y, uv, texSampler);
	deviations[2] = regionStandardDeviation(  moveSize, r3X, r3Y, uv, texSampler, averages[2]);

	//region4
	vec2 r4X = vec2(0.0, windowSize);
	vec2 r4Y = vec2(-windowSize, 0.0);
	averages[3] = regionAverage(            moveSize, r4X, r4Y, uv, texSampler);
	deviations[3] = regionStandardDeviation(  moveSize, r4X, r4Y, uv, texSampler, averages[3]);

	ivec4 selectedAverages = SelectAverages(deviations);

	vec4 result = vec4(0.0,0.0,0.0,0.0);
	for(int j = 0; j < 4; j++){
		result[j] = averages[selectedAverages[j]][j];
	}

	return result;
}

void main() {
	gl_FragColor = KawaharaFilter(fragUV, colorTexture);
}