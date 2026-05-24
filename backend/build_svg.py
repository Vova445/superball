import json
import os

paths_file = "ball_paths.json"
output_svg = r"c:\Users\Asus\Desktop\Мегабол\superball\frontend\public\assets\ball.svg"

with open(paths_file, "r") as f:
    faces = json.load(f)

svg_header = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Glow filter for the neon lines -->
    <filter id="neon-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="neon-glow-purple" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Clip path for the outer boundary of the sphere -->
    <clipPath id="ball-clip">
      <circle cx="256" cy="256" r="240" />
    </clipPath>

    <!-- Dark panels base gradient -->
    <linearGradient id="panel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2335" />
      <stop offset="30%" stop-color="#161824" />
      <stop offset="100%" stop-color="#0a0c12" />
    </linearGradient>

    <!-- Lighting overlays to make it 3D -->
    <!-- Cyan glow from the bottom-right (kick/light source) -->
    <radialGradient id="cyan-rim-glow" cx="80%" cy="80%" r="70%">
      <stop offset="0%" stop-color="#00f6ff" stop-opacity="0.85" />
      <stop offset="25%" stop-color="#00d8ff" stop-opacity="0.5" />
      <stop offset="60%" stop-color="#0055ff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Purple/magenta glow from the top-left (back rim light) -->
    <radialGradient id="purple-rim-glow" cx="20%" cy="20%" r="75%">
      <stop offset="0%" stop-color="#bd00ff" stop-opacity="0.75" />
      <stop offset="30%" stop-color="#8c00ff" stop-opacity="0.35" />
      <stop offset="70%" stop-color="#3d0099" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Spherical shadow overlay for 3D volume -->
    <radialGradient id="spherical-shadow" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="50%" stop-color="#000000" stop-opacity="0.2" />
      <stop offset="85%" stop-color="#000000" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95" />
    </radialGradient>

    <!-- Glossy reflection at the top-left -->
    <linearGradient id="gloss-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
    </linearGradient>

    <!-- Metallic/Glossy highlights on individual panels -->
    <radialGradient id="panel-specular" cx="35%" cy="35%" r="45%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Base Black Sphere -->
  <circle cx="256" cy="256" r="240" fill="#040508" />

  <!-- Ball Content (Clipped to Circle) -->
  <g clip-path="url(#ball-clip)">
"""

svg_body = ""

# Draw the dark panels
for face in faces:
    svg_body += f'    <path d="{face["d"]}" fill="url(#panel-gradient)" />\n'

# Draw specular highlights on individual panels to make them look glossy
# We only do this for panels with high Z-depth (closer to front)
for face in faces:
    if face["center_z"] > 0.0:
        svg_body += f'    <path d="{face["d"]}" fill="url(#panel-specular)" />\n'

# Draw the neon seam lines in layers:
# Layer 1: Thick blue/cyan glow (applied to all paths)
svg_body += '\n    <!-- Glowing seams (Cyan/Blue neon) -->\n'
for face in faces:
    svg_body += f'    <path d="{face["d"]}" fill="none" stroke="#00d8ff" stroke-width="4.5" opacity="0.85" filter="url(#neon-glow-cyan)" stroke-linejoin="round" />\n'

# Layer 2: Sharp white core to make the light look intense
for face in faces:
    svg_body += f'    <path d="{face["d"]}" fill="none" stroke="#e0ffff" stroke-width="1.2" opacity="0.95" stroke-linejoin="round" />\n'

# Add 3D Shading & Glow Overlays on top of the panels and seams
svg_body += """
    <!-- Dual-color ambient and directional lighting overlays -->
    <!-- Top-Left purple rim light -->
    <circle cx="256" cy="256" r="240" fill="url(#purple-rim-glow)" style="mix-blend-mode: screen;" />

    <!-- Bottom-Right cyan rim light -->
    <circle cx="256" cy="256" r="240" fill="url(#cyan-rim-glow)" style="mix-blend-mode: screen;" />

    <!-- Volumetric shading (spherical shadow) -->
    <circle cx="256" cy="256" r="240" fill="url(#spherical-shadow)" />

    <!-- Overall glossy reflection -->
    <ellipse cx="200" cy="140" rx="140" ry="70" transform="rotate(-35 200 140)" fill="url(#gloss-gradient)" />
  </g>

  <!-- Sharp Outer Rim Highlight -->
  <circle cx="256" cy="256" r="239" fill="none" stroke="#00f6ff" stroke-width="2" opacity="0.3" />
</svg>
"""

with open(output_svg, "w") as f:
    f.write(svg_header + svg_body)

print(f"Successfully generated beautiful gameplay ball SVG at {output_svg}")
