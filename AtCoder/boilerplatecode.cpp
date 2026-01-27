#include <bits/stdc++.h>
using namespace std;

struct FastIO {
    FastIO() {
        ios::sync_with_stdio(false);
        cin.tie(NULL);
    }
};

long long predi(int k, int ind, long long h, long long b, long long hp,
                const vector<vector<int>>& a, const vector<int>& w,
                vector<vector<long long>>& dp) {
    if (ind == (int)w.size()) {
        if (h <= b) {
            return hp;
        }
        return 0;
    }
    if (dp[k][ind] != -1) {
        return dp[k][ind];
    }
    
    long long l = predi(0, ind + 1, h + w[ind], hp + a[0][ind], b, a, w, dp);
    long long r = predi(1, ind + 1, h, b + w[ind], hp + a[1][ind], a, w, dp);
    return dp[k][ind] = max(l, r);
}

int main() {
    FastIO fastio;  // Enable fast I/O
    
    int testCases = 1; // You can read from input if needed
    // cin >> testCases;
    while (testCases--) {
        // Your code here
    }
    
    return 0;
}