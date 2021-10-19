float specular(vec3 lightDirection, vec3 normal, vec3 viewVector, vec2 specParams){
    vec3 VertexToEye = -viewVector;
    vec3 LightReflect = normalize(reflect(lightDirection, normal));
    float SpecularFactor = dot(VertexToEye, LightReflect);
    SpecularFactor = pow(SpecularFactor, specParams.x);
    SpecularFactor = specParams.y * SpecularFactor;
    return SpecularFactor;
}