#include <bits/stdc++.h>
using namespace std;
int main() {
    string a;
    cin >> a;
    for (int i = 0; i < a.size(); i++) {
        cout << a << endl;
        char first = a[0];
        for (int j = 0; j < a.size() - 1; j++) {
            a[j] = a[j + 1];
        }
        a[a.size() - 1] = first;
    }
    return 0;
}