#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, cols;
    cin >> rows >> cols;

    vector<string> matrix(rows);
    for (int i = 0; i < rows; i++) {
        matrix[i].resize(cols);
        for (int j = 0; j < cols; j++) {
            cin >> matrix[i][j];
        }
    }

    vector<int> row_metal, col_metal;
    for (int i = 0; i < rows; i++) {
        if (all_of(matrix[i].begin(), matrix[i].end(), [](char ch){ return ch != '.'; }))
            row_metal.push_back(i);
    }
    for (int j = 0; j < cols; j++) {
        bool complete = true;
        for (int i = 0; i < rows; i++)
            if (matrix[i][j] == '.') complete = false;
        if (complete) col_metal.push_back(j);
    }

    vector<vector<bool>> junction_point(rows, vector<bool>(cols, false));
    for (int c : col_metal) {
        for (int i = 0; i < rows; i++) {
            int prev_col = c - 1, next_col = c + 1;
            if (prev_col >= 0 && next_col < cols && matrix[i][prev_col] == 'C' && matrix[i][next_col] == 'C')
                junction_point[i][c] = true;
        }
    }
    for (int r : row_metal) {
        for (int j = 0; j < cols; j++) {
            int prev_row = r - 1, next_row = r + 1;
            if (prev_row >= 0 && next_row < rows && matrix[prev_row][j] == 'C' && matrix[next_row][j] == 'C')
                junction_point[r][j] = true;
        }
    }

    vector<vector<bool>> wire_network(rows, vector<bool>(cols, false));
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            if (matrix[i][j] == 'C' || junction_point[i][j])
                wire_network[i][j] = true;

    vector<vector<int>> graph(rows * cols);
    int row_dir[4] = {-1, 0, 1, 0};
    int col_dir[4] = {0, 1, 0, -1};

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (!wire_network[i][j]) continue;
            int node_id = i * cols + j;
            for (int d = 0; d < 4; d++) {
                int new_i = i + row_dir[d], new_j = j + col_dir[d];
                if (new_i >= 0 && new_i < rows && new_j >= 0 && new_j < cols && wire_network[new_i][new_j])
                    graph[node_id].push_back(new_i * cols + new_j);
            }
        }
    }

    int begin_node = -1;
    for (int i = 0; i < rows && begin_node == -1; i++)
        for (int j = 0; j < cols; j++)
            if (wire_network[i][j] && graph[i * cols + j].size() == 1) {
                begin_node = i * cols + j;
                break;
            }

    vector<bool> explored(rows * cols, false);
    vector<int> horizontal_sum(rows, 0), vertical_sum(cols, 0);

    int current = begin_node, previous = -1;
    explored[current] = true;

    while (true) {
        int cur_row = current / cols, cur_col = current % cols;
        int next_node = -1;
        for (int neighbor : graph[current])
            if (neighbor != previous && !explored[neighbor]) {
                next_node = neighbor;
                break;
            }

        if (junction_point[cur_row][cur_col] && previous != -1) {
            int prev_row = previous / cols, prev_col = previous % cols;
            int multiplier = (matrix[cur_row][cur_col] == 'C') ? 1 : -1;

            if (prev_row == cur_row)
                vertical_sum[cur_col] += ((prev_col < cur_col) ? 1 : -1) * multiplier;
            else
                horizontal_sum[cur_row] += ((prev_row < cur_row) ? 1 : -1) * multiplier;
        }

        if (next_node == -1) break;
        previous = current;
        current = next_node;
        explored[current] = true;
    }

    long long result = 0;
    for (int r : row_metal) result += abs(horizontal_sum[r]) / 2;
    for (int c : col_metal)   result += abs(vertical_sum[c]) / 2;

    cout << result;
    return 0;
}
