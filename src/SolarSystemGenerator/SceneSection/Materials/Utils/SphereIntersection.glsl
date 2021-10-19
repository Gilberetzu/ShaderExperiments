vec2 sphIntersect( in vec3 ro, in vec3 rd, in vec3 ce, float ra ) //from https://iquilezles.org/www/articles/intersectors/intersectors.htm
{
    vec3 oc = ro - ce;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - ra*ra;
    float h = b*b - c;
    if( h<0.0 ) return vec2(-1.0, 0); // no intersection
    h = sqrt( h );
    return vec2( -b-h, -b+h );
}