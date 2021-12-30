#include <packing>

varying vec2 fragUV;

uniform sampler2D points0Tex;
//uniform vec3 points1[4096];
uniform vec2 texelSize;

void main() {
	vec2 pixelCoord = fragUV/texelSize;
	
	vec3 tex3dPos = vec3(mod(pixelCoord.x, 128.0), mod(pixelCoord.y, 128.0), floor(pixelCoord.x / 128.0) + floor(pixelCoord.y / 128.0) * 16.0);

	vec3 cellPosF0 = tex3dPos/16.0;
	vec3 posInsideCell0 = fract(cellPosF0);
	vec3 cellPos0 = floor(cellPosF0);

	float minDistance = 2.0;
	for (int ni = 0; ni < 3; ni++)
	{
		for (int nj = 0; nj < 3; nj++)
		{
			for (int nk = 0; nk < 3; nk++)
			{
				ivec3 posOffset = ivec3(ni - 1, nj - 1, nk - 1);
				ivec3 cellPos0i = ivec3(cellPos0);

				ivec3 cp = cellPos0i + posOffset;
				cp = ivec3(int(mod(float(cp.x), 8.0)), int(mod(float(cp.y), 8.0)), int(mod(float(cp.z), 8.0)));
				int index = cp.x + cp.y * 8 + cp.z * 8 * 8;
				vec3 point = texture2D(points0Tex, vec2(float(index) / 512.0, 0)).xyz;
				point += vec3(posOffset);
				float dist = length(posInsideCell0 - point);
				if(dist < minDistance){
					minDistance = dist;
				}
			}
		}
	}

	//vec3 cellPosF1 = tex3dPos/8.0;
	//vec3 posInsideCell1 = fract(cellPosF1);
	//vec3 cellPos1 = floor(cellPosF1);

	gl_FragColor = vec4(minDistance,0.0,0.0, 1.0);
	//gl_FragColor = vec4(visualizePosition(worldPos), 1.0);
}