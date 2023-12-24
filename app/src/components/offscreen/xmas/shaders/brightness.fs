precision mediump float;

#define R_LUMINANCE 0.298912
#define G_LUMINANCE 0.586611
#define B_LUMINANCE 0.114478

uniform sampler2D uTexture; // テクスチャ番号  
uniform float time;
varying vec2 vTexCoord; // テクスチャ座標

void main (void) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    float v = texColor.r * R_LUMINANCE + texColor.g * G_LUMINANCE + texColor.b * B_LUMINANCE;
    v *= ((pow(sin(time / 700.0), 2.0)) / 1.6);
    gl_FragColor = vec4(vec3(v, v, v * 1.2), 1.0); // 青みはやや強くする
}