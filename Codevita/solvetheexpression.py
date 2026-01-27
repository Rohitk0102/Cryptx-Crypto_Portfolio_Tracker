def main():
    import sys
    data_reader = sys.stdin.readline

    digit_display = [sys.stdin.readline().rstrip('\n') for _ in range(3)]
   
    operator_display = [sys.stdin.readline().rstrip('\n') for _ in range(3)]
  
    expression_display = [sys.stdin.readline().rstrip('\n') for _ in range(3)]

    def get_segment_patterns(display_data, segment_count):
        segment_list = []
        for segment_index in range(segment_count):
            segment_pattern = []
            for row_index in range(3):
                display_segment = display_data[row_index][segment_index*3:segment_index*3+3]
                for character in display_segment:
                    segment_pattern.append('1' if character != ' ' else '0')
            segment_list.append(''.join(segment_pattern))
        return segment_list

    digit_segments = get_segment_patterns(digit_display, 10)
    operator_segments = get_segment_patterns(operator_display, 5)
    operator_symbols = ["||", "&&", "!", "(", ")"]

    token_count = len(expression_display[0]) // 3
    expression_tokens = []
    for token_index in range(token_count):
        token_pattern = []
        for row_index in range(3):
            token_segment = expression_display[row_index][token_index*3:token_index*3+3]
            for character in token_segment:
                token_pattern.append('1' if character != ' ' else '0')
        expression_tokens.append(''.join(token_pattern))

    parsed_tokens = []
    for token_pattern in expression_tokens:
        identified_token = None
        for digit_value in range(10):
            if token_pattern == digit_segments[digit_value]:
                identified_token = str(digit_value)
                break
        if identified_token is None:
            for operator_index in range(5):
                if token_pattern == operator_segments[operator_index]:
                    identified_token = operator_symbols[operator_index]
                    break
        if identified_token is None:
            identified_token = "?"
        parsed_tokens.append(identified_token)

   
    consolidated_tokens = []
    current_digits = []
    for token in parsed_tokens:
        if len(token) == 1 and token.isdigit():
            current_digits.append(token)
        else:
            if current_digits:
                consolidated_tokens.append(''.join(current_digits))
                current_digits = []
            consolidated_tokens.append(token)
    if current_digits:
        consolidated_tokens.append(''.join(current_digits))

    class ExpressionParser:
        def __init__(self, token_list, digit_patterns):
            self.token_stream = token_list
            self.current_position = 0
            self.digit_patterns_reference = digit_patterns

        def parse_expression(self):
            return self.parse_and_operation()

        def parse_and_operation(self):
            left_operand = self.parse_or_operation()
            while self.current_position < len(self.token_stream) and self.token_stream[self.current_position] == "&&":
                self.current_position += 1
                right_operand = self.parse_or_operation()
                left_operand = self.evaluate_binary_operation(left_operand, right_operand, "&&")
            return left_operand

        def parse_or_operation(self):
            left_operand = self.parse_not_operation()
            while self.current_position < len(self.token_stream) and self.token_stream[self.current_position] == "||":
                self.current_position += 1
                right_operand = self.parse_not_operation()
                left_operand = self.evaluate_binary_operation(left_operand, right_operand, "||")
            return left_operand

        def parse_not_operation(self):
            if self.current_position < len(self.token_stream) and self.token_stream[self.current_position] == "!":
                self.current_position += 1
                operand = self.parse_not_operation()
                return self.evaluate_unary_not(operand)
            else:
                return self.parse_primary_element()

        def parse_primary_element(self):
            if self.current_position >= len(self.token_stream):
                return ""
            current_token = self.token_stream[self.current_position]
            if current_token == "(":
                self.current_position += 1
                sub_expression = self.parse_expression()
                if self.current_position < len(self.token_stream) and self.token_stream[self.current_position] == ")":
                    self.current_position += 1
                return sub_expression
            else:
                self.current_position += 1
                binary_representation = []
                for digit_char in current_token:
                    digit_value = int(digit_char)
                    binary_representation.append(self.digit_patterns_reference[digit_value])
                return ''.join(binary_representation)

        def evaluate_binary_operation(self, operand_a, operand_b, operation):
            max_length = max(len(operand_a), len(operand_b))
            padded_a = operand_a.rjust(max_length, '0')
            padded_b = operand_b.rjust(max_length, '0')
            operation_result = []
            for bit_index in range(max_length):
                bit_a = padded_a[bit_index]
                bit_b = padded_b[bit_index]
                if operation == "&&":
                    operation_result.append('1' if bit_a == '1' and bit_b == '1' else '0')
                elif operation == "||":
                    operation_result.append('1' if bit_a == '1' or bit_b == '1' else '0')
            return ''.join(operation_result)

        def evaluate_unary_not(self, operand):
            inversion_result = []
            for bit_char in operand:
                inversion_result.append('0' if bit_char == '1' else '1')
            return ''.join(inversion_result)

    expression_parser = ExpressionParser(consolidated_tokens, digit_segments)
    final_binary_result = expression_parser.parse_expression()

  
    segment_size = 9
    total_segments = len(final_binary_result) // segment_size
    result_digits = []
    for segment_index in range(total_segments):
        binary_segment = final_binary_result[segment_index*segment_size:(segment_index+1)*segment_size]
        matched_digit = 0
        for digit_value in range(10):
            if binary_segment == digit_segments[digit_value]:
                matched_digit = digit_value
                break
        result_digits.append(str(matched_digit))

    final_numeric_string = ''.join(result_digits)
   
    start_index = 0
    while start_index < len(final_numeric_string) - 1 and final_numeric_string[start_index] == '0':
        start_index += 1
    final_numeric_string = final_numeric_string[start_index:]
    print(final_numeric_string)

if __name__ == "__main__":
    main()