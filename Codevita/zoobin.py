import sys
from collections import defaultdict, deque

sys.setrecursionlimit(10000)

def read_ints():
    input_data = sys.stdin.read().strip().split()
    if not input_data:
        return []
    return list(map(int, input_data))

def find_simple_cycles(graph, node_count):
    cycles_found = set()
    for root in range(1, node_count+1):
        path_stack = [root]
        visited_nodes = {root}
        def traverse(node):
            for neighbor in graph[node]:
                if neighbor < root:
                    continue
                if neighbor == root and len(path_stack) > 2:
                    cycles_found.add(tuple(path_stack[:]))
                elif neighbor not in visited_nodes:
                    visited_nodes.add(neighbor)
                    path_stack.append(neighbor)
                    traverse(neighbor)
                    path_stack.pop()
                    visited_nodes.remove(neighbor)
        traverse(root)
    return [list(cycle) for cycle in cycles_found]

def find_bijections(graph1, graph2, node_count):
    degree1 = [0]*(node_count+1)
    degree2 = [0]*(node_count+1)
    for i in range(1,node_count+1):
        degree1[i] = len(graph1[i])
        degree2[i] = len(graph2[i])
    possible_matches = {u: [v for v in range(1,node_count+1) if degree2[v]==degree1[u]] for u in range(1,node_count+1)}
    sorted_nodes = sorted(range(1,node_count+1), key=lambda x: -degree1[x])
    used_in_graph2 = [False]*(node_count+1)
    current_map = [0]*(node_count+1)
    solutions = []
    def check_consistency(node_u, node_v):
        for neighbor in graph1[node_u]:
            if current_map[neighbor] != 0:
                if current_map[neighbor] not in graph2[node_v]:
                    return False
        return True
    def search(position):
        if position >= node_count:
            solutions.append(current_map[1:].copy())
            return
        current_node = sorted_nodes[position]
        for candidate in possible_matches[current_node]:
            if not used_in_graph2[candidate] and check_consistency(current_node, candidate):
                used_in_graph2[candidate] = True
                current_map[current_node] = candidate
                search(position+1)
                current_map[current_node] = 0
                used_in_graph2[candidate] = False
    search(0)
    result_maps = []
    for mapping in solutions:
        result_maps.append(tuple(mapping))
    return result_maps

def rotate_mapping(mapping, cycle, direction=1):
    new_mapping = list(mapping)
    cycle_length = len(cycle)
    if direction == 1:
        for i in range(cycle_length):
            current = cycle[i] - 1
            next_node = cycle[(i+1) % cycle_length] - 1
            new_mapping[next_node] = mapping[current]
    else:
        for i in range(cycle_length):
            current = cycle[i] - 1
            previous = cycle[(i-1) % cycle_length] - 1
            new_mapping[previous] = mapping[current]
    return tuple(new_mapping)

def find_minimal_rotations(node_count, cycles, target_mapping):
    initial = tuple(range(1, node_count+1))
    if initial == target_mapping:
        return 0
    operations = []
    for cycle in cycles:
        if len(cycle) > 1:
            operations.append((tuple(cycle), 1))
            operations.append((tuple(cycle), -1))
    queue = deque()
    queue.append(initial)
    distances = {initial:0}
    while queue:
        current = queue.popleft()
        current_distance = distances[current]
        for cycle_info in operations:
            next_mapping = rotate_mapping(current, cycle_info[0], cycle_info[1])
            if next_mapping not in distances:
                if next_mapping == target_mapping:
                    return current_distance+1
                distances[next_mapping] = current_distance+1
                queue.append(next_mapping)
    return -1

def main():
    data = read_ints()
    if not data:
        return
    position = 0
    edge_count = data[position]; position += 1
    first_edges = []
    for _ in range(edge_count):
        u = data[position]; v = data[position+1]; position += 2
        first_edges.append((u,v))
    second_edges = []
    for _ in range(edge_count):
        u = data[position]; v = data[position+1]; position += 2
        second_edges.append((u,v))
    max_node = 0
    for u,v in first_edges+second_edges:
        max_node = max(max_node, u, v)
    node_count = max_node
    graph1 = {i:set() for i in range(1,node_count+1)}
    graph2 = {i:set() for i in range(1,node_count+1)}
    for u,v in first_edges:
        graph1[u].add(v); graph1[v].add(u)
    for u,v in second_edges:
        graph2[u].add(v); graph2[v].add(u)
    degree_list1 = sorted([len(graph1[i]) for i in range(1,node_count+1)])
    degree_list2 = sorted([len(graph2[i]) for i in range(1,node_count+1)])
    if degree_list1 != degree_list2:
        print(-1)
        return
    isomorphisms = find_bijections(graph1, graph2, node_count)
    if not isomorphisms:
        print(-1)
        return
    cycles = find_simple_cycles(graph1, node_count)
    best_result = None
    for isomorphism in isomorphisms:
        target = tuple(isomorphism)
        if cycles:
            rotations_needed = find_minimal_rotations(node_count, cycles, target)
        else:
            rotations_needed = 0 if target == tuple(range(1,node_count+1)) else -1
        if rotations_needed >= 0:
            if best_result is None or rotations_needed < best_result:
                best_result = rotations_needed
    print(best_result if best_result is not None else -1)

if __name__ == "__main__":
    main()