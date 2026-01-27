from collections import deque

def main():
    num_instructions = int(input().strip())
    _ = input().strip()  
    shuffled_list = [input().strip() for _ in range(num_instructions)]
    _ = input().strip()  
    original_list = [input().strip() for _ in range(num_instructions)]
    
    instruction_mapping = {}
    for idx, instr in enumerate(original_list):
        instruction_mapping[instr] = idx
        
    initial_sequence = []
    for instruction in shuffled_list:
        initial_sequence.append(instruction_mapping[instruction])
    initial_sequence = tuple(initial_sequence)
    target_sequence = tuple(range(num_instructions))
    
    if initial_sequence == target_sequence:
        print(0)
        return
        
    def get_neighbor_states(current_sequence):
        sequence_length = len(current_sequence)
        current_as_list = list(current_sequence)
        for start_idx in range(sequence_length):
            for end_idx in range(start_idx, sequence_length):
                segment = current_as_list[start_idx:end_idx+1]
                remaining_elements = current_as_list[:start_idx] + current_as_list[end_idx+1:]
                remaining_count = len(remaining_elements)
                for insert_position in range(remaining_count + 1):
                    if insert_position == start_idx:
                        continue
                    new_sequence = remaining_elements[:insert_position] + segment + remaining_elements[insert_position:]
                    yield tuple(new_sequence)
                    
    start_distances = {}
    goal_distances = {}
    start_queue = deque()
    goal_queue = deque()
    
    start_distances[initial_sequence] = 0
    start_queue.append(initial_sequence)
    
    goal_distances[target_sequence] = 0
    goal_queue.append(target_sequence)
    
    while start_queue and goal_queue:
        current_start_size = len(start_queue)
        for _ in range(current_start_size):
            current_state = start_queue.popleft()
            current_start_distance = start_distances[current_state]
            for next_state in get_neighbor_states(current_state):
                if next_state in goal_distances:
                    print(current_start_distance + 1 + goal_distances[next_state])
                    return
                if next_state not in start_distances:
                    start_distances[next_state] = current_start_distance + 1
                    start_queue.append(next_state)
                    
        current_goal_size = len(goal_queue)
        for _ in range(current_goal_size):
            current_state = goal_queue.popleft()
            current_goal_distance = goal_distances[current_state]
            for next_state in get_neighbor_states(current_state):
                if next_state in start_distances:
                    print(current_goal_distance + 1 + start_distances[next_state])
                    return
                if next_state not in goal_distances:
                    goal_distances[next_state] = current_goal_distance + 1
                    goal_queue.append(next_state)
                    
    print(-1)

if __name__ == '__main__':
    main()