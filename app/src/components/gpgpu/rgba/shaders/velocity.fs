precision mediump float;
uniform vec2 resolution; // テクスチャの縦横サイズ
uniform sampler2D texture; // 座標データの入ったテクスチャ
uniform sampler2D texture_pre; // 座標データの入ったテクスチャ
uniform vec2 mouse;
uniform float velocity;
uniform bool mouseFlag;
const float SPEED = 0.15;
const vec2 COLOR_MIX = vec2(1.0/255.0, 1.0);

vec2 rgba2float (vec4 rgba) {
    return vec2(dot(rgba.rb, COLOR_MIX), dot(rgba.ga, COLOR_MIX)) * 2.0 - 1.0;
}

void main () {
    vec2 p = gl_FragCoord.xy / resolution; // テクスチャのどこから値を取るか
    vec4 t_color = texture2D(texture, p); // テクスチャから取り出した座標データ
    vec2 t = rgba2float(t_color);

    vec2 diff = vec2(0.0);
    if(mouseFlag) {
        vec4 u_color = texture2D(texture_pre, p); // テクスチャから取り出した座標データ
        vec2 u = rgba2float(u_color); // 一つ前の座標
        diff = normalize(u - t); // 差分ベクトル 向きのみ。単位化
    }

    vec2 v = normalize(mouse - t.xy) * 0.2; // マウス座標と各頂点とのベクトル（長さは 0.2 固定）// マウス座標に寄っていくスピード
    vec2 w = normalize(diff.xy + v);
    vec2 newPosition = (t.xy + w * SPEED * velocity) * 0.5 + 0.5;
    vec4 destColor = vec4(
        fract(newPosition * 255.0),
        floor(newPosition * 255.0) / 255.0
    );

    gl_FragColor = destColor;
}

