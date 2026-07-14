#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float speed;
uniform float offset;
uniform float amp;
uniform float red;
uniform float green;
uniform float blue;
uniform float u_lightPulse;
uniform float u_ringRadius;
uniform float u_yJitterAmt;
uniform float u_yJitterSeed;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .1


float rand1(float x) {
    return fract(sin(x) * 43758.5453123);
}
vec2 hash( vec2 x )
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*sin((u_time*speed)*amp*fract(16.0 * k*fract( x.x*x.y*(x.x+x.y))));
}

float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

mat2 rot(float a){
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float sine(float rate){
    return sin(u_time*rate);
}

float sdBox( vec3 p, vec3 b )
{
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}



float sdTorus( vec3 p, vec2 t )
{
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}

float sdSphere( vec3 p, float r )
{
  return length(p) - r;
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float GetDist(vec3 p){
    float n = noise(2.5 * (u_resolution.xy * 0.5));
    float d = 1e9;

    vec3 q = p;
    q.xz *= rot(u_time * 0.09);
    q.xy *= rot(u_time * 0.35);

    // twist mapped to amp
    float k = amp * 2.0;
    float c = cos(k * q.y);
    float s = sin(k * q.y);
    q.xz = mat2(c, -s, s, c) * q.xz;

    float count = 8.0;
    float sphereRadius = 0.18;

    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float a = fi / count * 6.2831853;
        float r = u_ringRadius;

        float rnd = rand1(fi * 17.13 + u_yJitterSeed * 3.71);
        float yOff = (rnd * 3.0 - 1.0) * u_yJitterAmt;

        vec3 center = vec3(cos(a) * r, yOff, sin(a) * r);
        vec3 bp = q - center;
        bp.yz *= rot(u_time * 0.1 + fi);

        float sd = sdSphere(bp, sphereRadius);
        sd += sin(q.y + fi + u_time * 0.5) * 0.08;
        sd += n * 0.7;

        d = smin(d, sd, 0.25);
    }

    return d;
}

float rayMarch(vec3 rayO, vec3 rayD){
    float distO = .0;
    
    for(int i=0; i<MAX_STEPS; i++){
        vec3 p = rayO+distO*rayD;
        float distSc = GetDist(p);
        distO += distSc;
        if(distSc<SURF_DIST || distO>MAX_DIST) break;
    }
    return distO;
}

vec3 GetNormal(vec3 p) {
    float d = GetDist(p);
    vec2 e = vec2(0.01,0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

float getLight(vec3 p) {
    vec3 lightPos = vec3(0., sine(0.5), 0.);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    
    float dif = clamp(dot(n, l), 0.,3.);
    float d = rayMarch(p+n*SURF_DIST*2., l);
    if(d<length(lightPos-p)) dif *= .7;
    
    return dif;
}

float getLight2(vec3 p) {
    vec3 lightPos = vec3(1, 1, 0);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    
    float dif2 = clamp(dot(n, l),.0, 3.);
    float d = rayMarch(p+n*SURF_DIST*2., l);
    if(d<length(lightPos-p)) dif2 *= .1;
    
    return dif2;
}



void main()
{
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    float n = noise(2.5*(u_resolution.xy*.5));

    vec3 col = vec3(.4, green, blue);
    vec3 col2 = vec3(.4,.9,.7);
    
    vec3 rayO = vec3(0.,0.,-2.0);
    vec3 rayD = normalize(vec3(uv.x,uv.y,1.));
   
    float d = rayMarch(rayO,rayD);
    vec3 p = rayO + rayD * d;
    d /= 3.;
    
    float dif = getLight(p * .3);
    dif += u_lightPulse;
    dif = clamp(dif, 0.0, 2.0);
    col = vec3(dif * col);

    
    
    gl_FragColor = vec4(col,1.0);
}