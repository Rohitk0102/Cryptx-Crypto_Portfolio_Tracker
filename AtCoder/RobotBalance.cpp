#include <iostream>
using namespace std;

int main() {
    int H, B;
    cin >> H >> B;
    
    if (B >= H) {
        cout << 0 << endl;  
    } else {
        cout << H - B << endl; 
    }
    
    return 0;
}