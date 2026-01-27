import sys
import copy
from collections import Counter

class Cube:
    def __init__(self, faces):
        self.faces = copy.deepcopy(faces)
        self.N = len(faces[0][0])

    def copy(self):
        return Cube(self.faces)

    def rotate_face_cw(self, face):
        N = self.N
        new_face = [['' for _ in range(N)] for _ in range(N)]
        for i in range(N):
            for j in range(N):
                new_face[j][N - 1 - i] = face[i][j]
        return new_face

    def rotate_face_ccw(self, face):
        N = self.N
        new_face = [['' for _ in range(N)] for _ in range(N)]
        for i in range(N):
            for j in range(N):
                new_face[N - 1 - j][i] = face[i][j]
        return new_face

    def turn_left(self):
        new_faces = [None] * 6
        new_faces[3] = copy.deepcopy(self.faces[5])
        new_faces[4] = copy.deepcopy(self.faces[3])
        new_faces[1] = copy.deepcopy(self.faces[4])
        new_faces[5] = copy.deepcopy(self.faces[1])
        new_faces[0] = self.rotate_face_ccw(self.faces[0])
        new_faces[2] = self.rotate_face_cw(self.faces[2])
        self.faces = new_faces

    def turn_right(self):
        new_faces = [None] * 6
        new_faces[3] = copy.deepcopy(self.faces[4])
        new_faces[4] = copy.deepcopy(self.faces[1])
        new_faces[1] = copy.deepcopy(self.faces[5])
        new_faces[5] = copy.deepcopy(self.faces[3])
        new_faces[0] = self.rotate_face_cw(self.faces[0])
        new_faces[2] = self.rotate_face_ccw(self.faces[2])
        self.faces = new_faces

    def rotate_front(self):
        new_faces = [None] * 6
        new_faces[3] = copy.deepcopy(self.faces[2])
        new_faces[0] = copy.deepcopy(self.faces[3])
        new_faces[1] = copy.deepcopy(self.faces[0])
        new_faces[2] = copy.deepcopy(self.faces[1])
        new_faces[4] = self.rotate_face_cw(self.faces[4])
        new_faces[5] = self.rotate_face_ccw(self.faces[5])
        self.faces = new_faces

    def rotate_back(self):
        new_faces = [None] * 6
        new_faces[3] = copy.deepcopy(self.faces[0])
        new_faces[0] = copy.deepcopy(self.faces[1])
        new_faces[1] = copy.deepcopy(self.faces[2])
        new_faces[2] = copy.deepcopy(self.faces[3])
        new_faces[4] = self.rotate_face_ccw(self.faces[4])
        new_faces[5] = self.rotate_face_cw(self.faces[5])
        self.faces = new_faces

    def rotate_left(self):
        new_faces = [None] * 6
        new_faces[4] = copy.deepcopy(self.faces[2])
        new_faces[0] = copy.deepcopy(self.faces[4])
        new_faces[5] = copy.deepcopy(self.faces[0])
        new_faces[2] = copy.deepcopy(self.faces[5])
        new_faces[3] = self.rotate_face_ccw(self.faces[3])
        new_faces[1] = self.rotate_face_cw(self.faces[1])
        self.faces = new_faces

    def rotate_right(self):
        new_faces = [None] * 6
        new_faces[4] = copy.deepcopy(self.faces[0])
        new_faces[0] = copy.deepcopy(self.faces[5])
        new_faces[5] = copy.deepcopy(self.faces[2])
        new_faces[2] = copy.deepcopy(self.faces[4])
        new_faces[3] = self.rotate_face_cw(self.faces[3])
        new_faces[1] = self.rotate_face_ccw(self.faces[1])
        self.faces = new_faces

    def apply_instruction(self, instr):
        words = instr.split()
        if len(words) == 2:
            action = words[0]
            dir_ = words[1]
            if action == 'turn':
                if dir_ == 'left':
                    self.turn_left()
                elif dir_ == 'right':
                    self.turn_right()
            elif action == 'rotate':
                if dir_ == 'front':
                    self.rotate_front()
                elif dir_ == 'back':
                    self.rotate_back()
                elif dir_ == 'left':
                    self.rotate_left()
                elif dir_ == 'right':
                    self.rotate_right()
        else:
            side = words[0]
            num = int(words[1])
            dir_ = words[2]
            k = num - 1
            cw = self.get_cw(dir_, side)
            self.slice_turn(side, k, cw)

    def get_cw(self, dir_, side):
        if dir_ == 'up' or dir_ == 'right':
            return True
        else:
            return False

    def slice_turn(self, side, k, cw):
        pass

    def has_uniform_face(self):
        for face in self.faces:
            first = face[0][0]
            if all(all(cell == first for cell in row) for row in face):
                return True
        return False

    def has_almost_uniform_face(self):
        for face in self.faces:
            colors = [cell for row in face for cell in row]
            count = Counter(colors)
            if max(count.values()) == self.N * self.N - 1:
                return True
        return False

def main():
    data = sys.stdin.read().splitlines()
    idx = 0
    N, K = map(int, data[idx].split())
    idx += 1
    faces = []
    for _ in range(6):
        face = []
        for _ in range(N):
            line = data[idx].split()
            face.append(line)
            idx += 1
        faces.append(face)
    instructions = data[idx:idx + K]

    initial_cube = Cube(faces)

    extra = None
    is_faulty = None

    for skip in range(K):
        cube = initial_cube.copy()
        for i in range(K):
            if i != skip:
                cube.apply_instruction(instructions[i])
        if cube.has_uniform_face():
            extra = instructions[skip]
            is_faulty = False
            break

    if extra is None:
        for skip in range(K):
            cube = initial_cube.copy()
            for i in range(K):
                if i != skip:
                    cube.apply_instruction(instructions[i])
            if cube.has_almost_uniform_face():
                extra = instructions[skip]
                is_faulty = True
                break

    if is_faulty:
        print("Faulty")
        print(extra)
    elif extra:
        print(extra)
    else:
        print("Not Possible")

if __name__ == "__main__":
    main()