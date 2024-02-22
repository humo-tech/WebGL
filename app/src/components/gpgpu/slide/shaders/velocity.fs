precision highp float;
uniform vec2 resolution; // テクスチャの縦横サイズ
uniform sampler2D texture; // 座標データの入ったテクスチャ
uniform bool isFloat;
const vec2 COLOR_MIX = vec2(1.0/255.0, 1.0);

vec2 rgba2float (vec4 rgba) {
    return vec2(dot(rgba.rb, COLOR_MIX), dot(rgba.ga, COLOR_MIX)) * 2.0 - 1.0;
}

void main () {
    vec2 p = gl_FragCoord.xy / resolution; // テクスチャのどこから値を取るか
    vec4 t_color = texture2D(texture, p); // テクスチャから取り出した座標データ
    vec2 t;
    if(!isFloat) {
        t = rgba2float(t_color);
    } else {
        t = t_color.xy;
    }

    vec2 newPosition = t.xy + vec2(0.002, -0.002);
    if(newPosition.y < -1.0) {
        newPosition = vec2(newPosition.x, 1.0);
    }
    if(newPosition.x > 1.0) {
        newPosition = vec2(-1.0, newPosition.y);
    }

    vec4 destColor;
    if(!isFloat) {
        newPosition = newPosition * 0.5 + 0.5;
        destColor = vec4(
            fract(newPosition * 255.0),
            floor(newPosition * 255.0) / 255.0
        );
    } else {
        destColor = vec4(newPosition, 0.0, 1.0);
    }

    gl_FragColor = destColor;
}

