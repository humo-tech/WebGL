// 頂点テクスチャフェッチを使って、テクスチャから座標情報を読み出す
attribute float index; // pointリストのインデックス（座標ではない）
uniform vec2 resolution; // テクスチャの縦横サイズ
uniform sampler2D texture; // pointインデックスに対応するテクスチャ（座標が入っている）
uniform float devicePixelRatio;
uniform float pointScale;
uniform bool isFloat;
const vec2 COLOR_MIX = vec2(1.0/255.0, 1.0);
varying vec4 pointColor;

vec2 rgba2float (vec4 rgba) {
    return vec2(dot(rgba.rb, COLOR_MIX), dot(rgba.ga, COLOR_MIX)) * 2.0 - 1.0;
}

void main() {
    // テクスチャのどこからデータを取るか
    vec2 p = vec2(
        mod(index, resolution.x) / resolution.x,
        floor(index / resolution.x) / resolution.y
    );

    vec4 t_color = texture2D(texture, p);
    vec2 t;
    if(!isFloat) {
        t = rgba2float(t_color);
    } else {
        t = t_color.xy;
    }

    pointColor = vec4(t + 1.0, 0.0, 1.0);
    gl_Position = vec4(t, 0.0, 1.0);
    gl_PointSize = pointScale;
}