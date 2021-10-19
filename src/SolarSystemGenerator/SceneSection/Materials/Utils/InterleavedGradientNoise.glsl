float InterleavedGradientNoise(vec2 screnPos){
	vec3 magic = vec3( 0.06711056, 0.00583715, 52.9829189 );
	return fract( magic.z * fract( dot( screnPos, magic.xy ) ) );
}