import json
import os
import math

paths_file = "ball_paths.json"
output_logo_svg = r"c:\Users\Asus\Desktop\Мегабол\superball\frontend\public\assets\logo_ball.svg"

with open(paths_file, "r") as f:
    faces = json.load(f)

# Helper to generate circular arcs
def get_arc_path(cx, cy, r, start_deg, end_deg):
    a1 = math.radians(start_deg)
    a2 = math.radians(end_deg)
    x1 = cx + r * math.cos(a1)
    y1 = cy + r * math.sin(a1)
    x2 = cx + r * math.cos(a2)
    y2 = cy + r * math.sin(a2)
    diff = (end_deg - start_deg) % 360
    large_arc = 1 if diff > 180 else 0
    return f"M {x1:.2f} {y1:.2f} A {r} {r} 0 {large_arc} 1 {x2:.2f} {y2:.2f}"

svg_header = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Glow filters -->
    <filter id="neon-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="neon-glow-purple" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <clipPath id="logo-ball-clip">
      <circle cx="256" cy="256" r="185" />
    </clipPath>

    <!-- Gradients -->
    <linearGradient id="left-ring-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff00d0" />
      <stop offset="100%" stop-color="#8000ff" />
    </linearGradient>

    <linearGradient id="right-ring-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00f6ff" />
      <stop offset="100%" stop-color="#003cd8" />
    </linearGradient>

    <linearGradient id="panel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14151e" />
      <stop offset="100%" stop-color="#090a0e" />
    </linearGradient>
  </defs>

  <!-- Background Glow behind the whole emblem -->
  <circle cx="256" cy="256" r="220" fill="#000000" />

  <!-- Background Soccer Ball Group (Clipped) -->
  <g clip-path="url(#logo-ball-clip)">
    <!-- Base Ball Face -->
    <circle cx="256" cy="256" r="185" fill="#07080c" />
"""

svg_body = ""

# Step 1: Draw the panel faces
for face in faces:
    # Scale panel paths from r=240 to r=185
    # The generated paths are based on cx=256, cy=256, r=240
    # Let's adjust coordinates to fit r=185
    # Coordinate mapping: p_new = 256 + (p - 256) * (185 / 240)
    d_parts = face["d"].split(" ")
    new_d_parts = []
    for part in d_parts:
        if part in ["M", "L", "Z"]:
            new_d_parts.append(part)
        else:
            try:
                val = float(part)
                # Map coordinate
                mapped = 256.0 + (val - 256.0) * (185.0 / 240.0)
                new_d_parts.append(f"{mapped:.2f}")
            except ValueError:
                new_d_parts.append(part)
    mapped_d = " ".join(new_d_parts)
    
    # Calculate average X of this panel to decide if it's left or right
    # We parse the coordinates to get the average
    x_coords = []
    for idx, part in enumerate(new_d_parts):
        if part in ["M", "L"]:
            x_coords.append(float(new_d_parts[idx+1]))
    avg_x = sum(x_coords) / len(x_coords) if x_coords else 256.0
    
    face["mapped_d"] = mapped_d
    face["avg_x"] = avg_x
    
    svg_body += f'    <path d="{mapped_d}" fill="url(#panel-grad)" />\n'

# Step 2: Draw the panel seam lines (Purple on left, Cyan on right)
svg_body += "\n    <!-- Panel lines with neon glow -->\n"
for face in faces:
    mapped_d = face["mapped_d"]
    if face["avg_x"] < 256.0:
        # Left side panel lines: Purple
        svg_body += f'    <path d="{mapped_d}" fill="none" stroke="#d000ff" stroke-width="3" opacity="0.8" filter="url(#neon-glow-purple)" stroke-linejoin="round" />\n'
        svg_body += f'    <path d="{mapped_d}" fill="none" stroke="#ffd9ff" stroke-width="0.8" opacity="0.9" stroke-linejoin="round" />\n'
    else:
        # Right side panel lines: Cyan
        svg_body += f'    <path d="{mapped_d}" fill="none" stroke="#00f0ff" stroke-width="3" opacity="0.8" filter="url(#neon-glow-cyan)" stroke-linejoin="round" />\n'
        svg_body += f'    <path d="{mapped_d}" fill="none" stroke="#d9ffff" stroke-width="0.8" opacity="0.9" stroke-linejoin="round" />\n'

svg_body += "  </g>\n\n"

# Step 3: Draw the split outer rings (with gaps for lightning bolt)
# Let's say R = 215, centered at 256, 256.
# Right Arc: -45 deg to 105 deg
# Left Arc: 135 deg to 285 deg
right_ring_path = get_arc_path(256, 256, 212, -45, 105)
left_ring_path = get_arc_path(256, 256, 212, 135, 285)

svg_body += "  <!-- Outer split ring -->\n"
svg_body += f'  <path d="{left_ring_path}" fill="none" stroke="url(#left-ring-grad)" stroke-width="15" stroke-linecap="round" filter="url(#neon-glow-purple)" />\n'
svg_body += f'  <path d="{left_ring_path}" fill="none" stroke="#ffd5ff" stroke-width="2.5" stroke-linecap="round" />\n'

svg_body += f'  <path d="{right_ring_path}" fill="none" stroke="url(#right-ring-grad)" stroke-width="15" stroke-linecap="round" filter="url(#neon-glow-cyan)" />\n'
svg_body += f'  <path d="{right_ring_path}" fill="none" stroke="#d5ffff" stroke-width="2.5" stroke-linecap="round" />\n'

# Step 4: Draw the stylized Lightning Bolt (with double glow and white core)
# Lightning path:
bolt_path = "M 360 40 L 240 210 L 310 210 L 140 470 L 250 270 L 180 270 Z"

svg_body += """
  <!-- Stylized Lightning Bolt -->
  <!-- Left Purple Glow -->
  <path d="{p}" fill="#d000ff" opacity="0.85" filter="url(#neon-glow-purple)" transform="translate(-8, -4)" />
  
  <!-- Right Cyan Glow -->
  <path d="{p}" fill="#00f6ff" opacity="0.85" filter="url(#neon-glow-cyan)" transform="translate(8, 4)" />
  
  <!-- White core of the lightning bolt -->
  <path d="{p}" fill="#ffffff" stroke="#e0ffff" stroke-width="2.5" />
</svg>
""".replace("{p}", bolt_path)

with open(output_logo_svg, "w") as f:
    f.write(svg_header + svg_body)

print(f"Successfully generated logo ball SVG at {output_logo_svg}")
