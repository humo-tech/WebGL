// デフォルトのパーティクルポジションを設定するだけのシェーダー
// フラグメントシェーダでは、各ピクセル座標（gl_FragCoord.xy）を resolution で割ることで、画面内に分散させている
precision mediump float;
uniform vec2 resolution;

void main () {
    vec2 p = ((gl_FragCoord.xy + 2.0 - 1.0) / resolution);
    vec4 destColor = vec4(
        fract(p * 255.0),
        floor(p * 255.0) / 255.0
    );
    gl_FragColor = destColor;
}