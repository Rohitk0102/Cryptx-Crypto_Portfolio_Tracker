import sys

input = sys.stdin.read
data = input().split()

index = 0
N = int(data[index])
index += 1

slides = []
for i in range(N):
    x1 = int(data[index])
    y1 = int(data[index + 1])
    x2 = int(data[index + 2])
    y2 = int(data[index + 3])
    slides.append([x1, y1, x2, y2])
    index += 4

sx = int(data[index])
sy = int(data[index + 1])
e = int(data[index + 2])

def on_segment(px, py, slide):
    x1, y1, x2, y2 = slide
    cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1)
    if cross != 0:
        return False
    dot = (px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)
    if dot < 0:
        return False
    squaredlen = (x2 - x1)**2 + (y2 - y1)**2
    if dot > squaredlen:
        return False
    return True

x = sx
y = sy
energy = e

while y > 0:
    num_slides = sum(1 for s in slides if on_segment(x, y, s))
    if num_slides > 1:
        cost = x * y
        if energy < cost:
            break
        energy -= cost

    has_next = False
    next_x = None
    next_y = None
    for d in [-1, 1]:
        nx = x + d
        ny = y - 1
        if ny < 0:
            continue
        shares = any(on_segment(x, y, s) and on_segment(nx, ny, s) for s in slides)
        if shares:
            has_next = True
            next_x = nx
            next_y = ny
            break  
    
    if has_next and energy >= 1:
        x = next_x
        y = next_y
        energy -= 1
        continue
    

    if num_slides > 0 and has_next:

        break

    found = False
    for yy in range(y - 1, -1, -1):
        if any(on_segment(x, yy, s) for s in slides):
            y = yy
            found = True
            break
    if not found:
        y = 0

print(x, y)