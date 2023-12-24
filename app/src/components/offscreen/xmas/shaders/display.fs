precision mediump float;

uniform sampler2D uTexture; // テクスチャ番号  
uniform sampler2D uBrightnessTexture; // テクスチャ番号  

varying vec2 vTexCoord; // テクスチャ座標

void main (void) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    vec4 texBrightness = texture2D(uBrightnessTexture, vec2(vTexCoord.x, 1.0 - vTexCoord.y));
    gl_FragColor = texColor + texBrightness;
    //gl_FragColor = vec4(vTexCoord, 0.0, 1.0);
}