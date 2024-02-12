precision mediump float;
uniform vec2 resolution; // テクスチャの縦横サイズ
uniform sampler2D texture; // 座標データの入ったテクスチャ
uniform vec2 mouse;
uniform bool mouseFlag;
uniform float velocity;
const float SPEED = 0.05;

void main () {
    vec2 p = gl_FragCoord.xy / resolution; // テクスチャのどこから値を取るか
    vec4 t = texture2D(texture, p); // テクスチャから取り出した座標データ
    vec2 v = normalize(mouse - t.xy) * 0.2; // マウス座標と各頂点とのベクトル（長さは 0.2 固定）// マウス座標に寄っていくスピード
    vec2 w = normalize(t.zw + v); // 一つ前の差分ベクトル(t.zw)に今回の差分ベクトル(v)を足し合わせて最終的な速度を決定
    vec2 newPosition = t.xy + w * SPEED * velocity;
    vec4 destColor = vec4(newPosition, w);
    if(!mouseFlag) {
        destColor.zw = t.zw;
    }
    gl_FragColor = destColor;
}

