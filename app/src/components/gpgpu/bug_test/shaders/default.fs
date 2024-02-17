// デフォルトのパーティクルポジションを設定するだけのシェーダー
// フラグメントシェーダでは、各ピクセル座標（gl_FragCoord.xy）を resolution で割ることで、画面内に分散させている
precision mediump float;
uniform vec2 resolution;

void main () {
    vec2 p = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;
    gl_FragColor = vec4(p, 0.0, 0.0);
}