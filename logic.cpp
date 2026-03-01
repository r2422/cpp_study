#include <iostream>
#include <cmath>
#include <emscripten.h> // WebAssembly用の特別な命令を使うため

// JSから呼び出せるようにするおまじない
extern "C" {

    // 3次方程式 ax^3 + bx^2 + cx + d = 0 の解を1つ探す関数
    EMSCRIPTEN_KEEPALIVE
    double solveCubic(double a, double b, double c, double d) {
        double x = 1.0; // 最初の予想値
        
        // ニュートン法：20回くらい計算すればかなり正確な値になる
        for (int i = 0; i < 20; i++) {
            // f(x) の計算
            double fx = a * pow(x, 3) + b * pow(x, 2) + c * x + d;
            // f'(x) 微分の計算（傾き）
            double fprime = 3 * a * pow(x, 2) + 2 * b * x + c;
            
            // 次の予想値を計算
            x = x - fx / fprime;
        }
        return x; // 見つかった解を返す
    }
}