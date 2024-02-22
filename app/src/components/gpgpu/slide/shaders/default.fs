// デフォルトのパーティクルポジションを設定するだけのシェーダー
// フラグメントシェーダでは、各ピクセル座標（gl_FragCoord.xy）を resolution で割ることで、画面内に分散させている
precision highp float;
uniform bool isFloat;
uniform vec2 resolution;

void main () {
    vec4 destColor;
    vec2 p = ((gl_FragCoord.xy) / resolution);
    if(!isFloat) {
        destColor = vec4(
            fract(p * 255.0),
            floor(p * 255.0) / 255.0
        );
    } else {
        destColor = vec4(p * 2.0 - 1.0, 0.0, 0.0);
    }
    gl_FragColor = destColor;
}