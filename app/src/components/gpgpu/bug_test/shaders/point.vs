// 頂点テクスチャフェッチを使って、テクスチャから座標情報を読み出す
attribute float index; // pointリストのインデックス（座標ではない）
uniform vec2 resolution; // テクスチャの縦横サイズ
uniform sampler2D texture; // ｐointインデックスに対応するテクスチャ（座標が入っている）
uniform float devicePixelRatio;
uniform float pointScale;

void main() {
    // テクスチャのどこからデータを取るか
    vec2 p = vec2(
        mod(index, resolution.x) / resolution.x,
        floor(index / resolution.x) / resolution.y
    );

    vec4 t = texture2D(texture, p);

    gl_Position = vec4(t.xy, 0.0, 1.0);
    gl_PointSize = (0.1 + pointScale) / devicePixelRatio;
}