import math
import json

def get_icosahedron():
    phi = (1 + 5**0.5) / 2
    # 12 vertices of icosahedron
    vertices = []
    # (0, +-1, +-phi)
    for y in [-1, 1]:
        for z in [-phi, phi]:
            vertices.append((0.0, y, z))
    # (+-phi, 0, +-1)
    for x in [-phi, phi]:
        for z in [-1, 1]:
            vertices.append((x, 0.0, z))
    # (+-1, +-phi, 0)
    for x in [-1, 1]:
        for y in [-phi, phi]:
            vertices.append((x, y, 0.0))
            
    # Normalize vertices
    vertices = [normalize(v) for v in vertices]
    
    # Find faces (triangles)
    # Three vertices form a face if the distance between all pairs is the edge length
    # Edge length of normalized icosahedron is approx 1.0514622
    faces = []
    n = len(vertices)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                d1 = dist(vertices[i], vertices[j])
                d2 = dist(vertices[j], vertices[k])
                d3 = dist(vertices[k], vertices[i])
                # Check if all are close to the edge length
                if abs(d1 - 1.05146) < 0.01 and abs(d2 - 1.05146) < 0.01 and abs(d3 - 1.05146) < 0.01:
                    faces.append((i, j, k))
                    
    # Orient faces consistently outwards
    oriented_faces = []
    for f in faces:
        v0, v1, v2 = vertices[f[0]], vertices[f[1]], vertices[f[2]]
        # Center of face
        c = ((v0[0]+v1[0]+v2[0])/3, (v0[1]+v1[1]+v2[1])/3, (v0[2]+v1[2]+v2[2])/3)
        # Normal
        cross = np_cross(np_sub(v1, v0), np_sub(v2, v0))
        if np_dot(cross, c) < 0:
            oriented_faces.append((f[0], f[2], f[1]))
        else:
            oriented_faces.append(f)
            
    return vertices, oriented_faces

def dist(v1, v2):
    return sum((x - y)**2 for x, y in zip(v1, v2))**0.5

def normalize(v):
    l = sum(x**2 for x in v)**0.5
    return (v[0]/l, v[1]/l, v[2]/l)

def np_sub(v1, v2):
    return (v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2])

def np_dot(v1, v2):
    return sum(x*y for x, y in zip(v1, v2))

def np_cross(v1, v2):
    return (
        v1[1]*v2[2] - v1[2]*v2[1],
        v1[2]*v2[0] - v1[0]*v2[2],
        v1[0]*v2[1] - v1[1]*v2[0]
    )

def truncate_icosahedron(ico_verts, ico_faces):
    # For each face of icosahedron (triangle), we get 6 vertices
    # For each edge of icosahedron, we get two vertices at 1/3 and 2/3
    # Let's map edges to new vertex indices
    edge_new_verts = {}
    new_verts = []
    
    def get_new_vert(i, j):
        key = tuple(sorted((i, j)))
        if key not in edge_new_verts:
            v_i = ico_verts[i]
            v_j = ico_verts[j]
            # V1 is 1/3 of the way from v_i to v_j
            v1 = normalize(( (2*v_i[0] + v_j[0])/3, (2*v_i[1] + v_j[1])/3, (2*v_i[2] + v_j[2])/3 ))
            # V2 is 2/3 of the way from v_i to v_j
            v2 = normalize(( (v_i[0] + 2*v_j[0])/3, (v_i[1] + 2*v_j[1])/3, (v_i[2] + 2*v_j[2])/3 ))
            idx1 = len(new_verts)
            new_verts.append(v1)
            idx2 = len(new_verts)
            new_verts.append(v2)
            edge_new_verts[key] = (idx1, idx2) # idx1 is near i, idx2 is near j
        
        idx1, idx2 = edge_new_verts[key]
        if key[0] == i:
            return idx1, idx2 # idx1 is near i, idx2 is near j
        else:
            return idx2, idx1 # idx2 is near i, idx1 is near j

    # Now create hexagons from the 20 triangular faces
    hexagons = []
    for f in ico_faces:
        i0, i1, i2 = f
        # Edges are (i0, i1), (i1, i2), (i2, i0)
        e0_near_i0, e0_near_i1 = get_new_vert(i0, i1)
        e1_near_i1, e1_near_i2 = get_new_vert(i1, i2)
        e2_near_i2, e2_near_i0 = get_new_vert(i2, i0)
        hexagons.append([e0_near_i0, e0_near_i1, e1_near_i1, e1_near_i2, e2_near_i2, e2_near_i0])
        
    # Now create pentagons around the 12 vertices of the icosahedron
    pentagons = []
    for i in range(len(ico_verts)):
        # Find all neighbors of vertex i in the icosahedron
        neighbors = []
        for f in ico_faces:
            if i in f:
                idx = f.index(i)
                n1 = f[(idx+1)%3]
                n2 = f[(idx+2)%3]
                if n1 not in neighbors: neighbors.append(n1)
                if n2 not in neighbors: neighbors.append(n2)
        # We need to sort neighbors circularly around vertex i
        # To do this, project neighbors to a plane normal to vertex i
        v_i = ico_verts[i]
        # Base vectors for plane
        if abs(v_i[0]) < 0.9:
            u = normalize(np_cross(v_i, (1, 0, 0)))
        else:
            u = normalize(np_cross(v_i, (0, 1, 0)))
        w = np_cross(v_i, u)
        
        def get_angle(n_idx):
            v_n = ico_verts[n_idx]
            proj_u = np_dot(v_n, u)
            proj_w = np_dot(v_n, w)
            return math.atan2(proj_w, proj_u)
            
        neighbors.sort(key=get_angle)
        
        pent_face = []
        for n in neighbors:
            # Get the new vertex near i on the edge (i, n)
            near_i, near_n = get_new_vert(i, n)
            pent_face.append(near_i)
        pentagons.append(pent_face)
        
    return new_verts, hexagons, pentagons

def rotate_x(v, angle):
    c, s = math.cos(angle), math.sin(angle)
    return (v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c)

def rotate_y(v, angle):
    c, s = math.cos(angle), math.sin(angle)
    return (v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c)

def rotate_z(v, angle):
    c, s = math.cos(angle), math.sin(angle)
    return (v[0]*c - v[1]*s, v[0]*s + v[1]*c, v[2])

def subdivide_edge(v1, v2, steps=10):
    path_points = []
    for s in range(steps + 1):
        t = s / steps
        # Linear interpolation
        interp = (
            v1[0]*(1-t) + v2[0]*t,
            v1[1]*(1-t) + v2[1]*t,
            v1[2]*(1-t) + v2[2]*t
        )
        # Project back to sphere
        path_points.append(normalize(interp))
    return path_points

def main():
    ico_verts, ico_faces = get_icosahedron()
    verts, hexagons, pentagons = truncate_icosahedron(ico_verts, ico_faces)
    
    # We want to rotate the ball to match the kicked gameplay ball:
    # It has a pentagon at top-left-center.
    # Let's rotate about Y and X to orient it nicely.
    # Trial and error angles (e.g. rot_y = 0.5, rot_x = -0.4, rot_z = 0.2)
    rot_x = -0.4
    rot_y = 0.5
    rot_z = -0.1
    
    rotated_verts = []
    for v in verts:
        v_rot = rotate_y(v, rot_y)
        v_rot = rotate_x(v_rot, rot_x)
        v_rot = rotate_z(v_rot, rot_z)
        rotated_verts.append(v_rot)
        
    # Scale and center coordinates
    cx, cy = 256, 256
    r = 240 # radius of ball inside 512x512 canvas
    
    svg_elements = []
    
    # Draw faces
    # Separate pentagons and hexagons
    all_faces = [('pentagon', p) for p in pentagons] + [('hexagon', h) for h in hexagons]
    
    # We want to sort faces by their center Z coordinate so we can discard back faces,
    # or handle occlusion if any. But since it's a sphere, if the center Z is positive,
    # the face is on the front side of the sphere.
    front_faces = []
    for face_type, f_indices in all_faces:
        f_verts = [rotated_verts[idx] for idx in f_indices]
        center_z = sum(v[2] for v in f_verts) / len(f_verts)
        
        # Check if all vertices are on the visible side (z > -0.1)
        # Some border faces might have some vertices on the back side, which we clip using the outer circle clip-path
        if center_z > -0.2:
            front_faces.append((center_z, face_type, f_indices))
            
    # Sort front faces by Z (backmost of front faces first, though for front hemisphere it's mostly fine)
    front_faces.sort(key=lambda x: x[0])
    
    # Generate SVG path for each face
    for center_z, face_type, f_indices in front_faces:
        # Create a curved path by subdividing each edge
        path_points = []
        n = len(f_indices)
        for i in range(n):
            v1 = rotated_verts[f_indices[i]]
            v2 = rotated_verts[f_indices[(i+1)%n]]
            edge_points = subdivide_edge(v1, v2, steps=10)
            if i > 0:
                path_points.extend(edge_points[1:]) # skip start point to avoid duplicate
            else:
                path_points.extend(edge_points)
                
        # Project path points to 2D
        d_str = []
        for idx, p in enumerate(path_points):
            px = cx + r * p[0]
            py = cy + r * p[1]
            if idx == 0:
                d_str.append(f"M {px:.2f} {py:.2f}")
            else:
                d_str.append(f"L {px:.2f} {py:.2f}")
        d_str.append("Z")
        d_path = " ".join(d_str)
        
        svg_elements.append({
            'type': face_type,
            'd': d_path,
            'center_z': center_z
        })
        
    print(f"Generated {len(svg_elements)} face paths.")
    
    # Output to json to use in another script
    with open("ball_paths.json", "w") as f:
        json.dump(svg_elements, f, indent=2)

if __name__ == '__main__':
    main()
