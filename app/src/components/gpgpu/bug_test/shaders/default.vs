// デフォルトのパーティクルポジションを設定するだけのシェーダー
// 頂点シェーダでは、単に板ポリの4隅の情報を送っているだけ
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}