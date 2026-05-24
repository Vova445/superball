# pyrefly: ignore [missing-import]
from PIL import Image
import os

src_path = r"c:\Users\Asus\Desktop\Мегабол\superball\ChatGPT Image 19 трав. 2026 р., 16_57_07.png"
dest_dir = r"C:\Users\Asus\.gemini\antigravity\brain\c2db8945-4bd2-4655-a85e-c1c294af6b27"

if os.path.exists(src_path):
    img = Image.open(src_path)
    # Crop Logo Ball: approx x: 350 to 750, y: 50 to 450 (relative to 1530x1028)
    # Let's adjust based on visual estimation
    logo_ball = img.crop((350, 50, 750, 450))
    logo_ball.save(os.path.join(dest_dir, "logo_ball_crop.png"))
    
    # Crop Gameplay Ball: approx x: 350 to 650, y: 450 to 750
    gameplay_ball = img.crop((350, 450, 650, 750))
    gameplay_ball.save(os.path.join(dest_dir, "gameplay_ball_crop.png"))
    
    print("Saved cropped images.")
else:
    print("Source not found.")
