import cv2
import numpy as np
import os

def process_image(image_path: str):
    image = cv2.imread(image_path)
    if image is None:
        return {"status": "error", "message": "ไม่สามารถโหลดภาพได้"}

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # STEP 1: ตรวจจับปลายแถบสีเหลือง
    lower_yellow_tip = np.array([20, 80, 80])
    upper_yellow_tip = np.array([23, 255, 255])
    mask_yellow_tip = cv2.inRange(hsv, lower_yellow_tip, upper_yellow_tip)

    contours, _ = cv2.findContours(mask_yellow_tip, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return {"status": "error", "message": "ไม่พบปลายแถบสีเหลือง"}

    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    yellow_tip = image[y:y+h, x:x+w]
    yellow_tip_path = os.path.join("outputs", "yellow_tip.jpg")
    cv2.imwrite(yellow_tip_path, yellow_tip)

    # STEP 2
    strip_height = 200
    strip = image[y+h:y+h+strip_height, x:x+w]
    strip_hsv = cv2.cvtColor(strip, cv2.COLOR_BGR2HSV)

    # STEP 3
    yellow_tip_hsv = cv2.cvtColor(yellow_tip, cv2.COLOR_BGR2HSV)
    h_mean, s_mean, v_mean = cv2.mean(yellow_tip_hsv)[:3]

    lower_dynamic_yellow = np.array([
        max(0, h_mean - 6),
        max(0, s_mean - 60),
        max(0, v_mean - 60)
    ])
    upper_dynamic_yellow = np.array([
        min(179, h_mean + 6),
        min(255, s_mean + 60),
        min(255, v_mean + 60)
    ])

    yellow_mask = cv2.inRange(strip_hsv, lower_dynamic_yellow, upper_dynamic_yellow)

    not_yellow_found = False
    start_row = 0
    for row in range(strip.shape[0]):
        row_pixels = yellow_mask[row, :]
        yellow_ratio = np.count_nonzero(row_pixels) / row_pixels.size
        if yellow_ratio < 0.9:
            start_row = row
            not_yellow_found = True
            break

    if not_yellow_found:
        color_strip = strip[start_row:start_row+100, :]
    else:
        color_strip = strip

    color_strip_hsv = cv2.cvtColor(color_strip, cv2.COLOR_BGR2HSV)

    lower_color = np.array([0, 40, 40])
    upper_color = np.array([179, 255, 255])
    color_mask = cv2.inRange(color_strip_hsv, lower_color, upper_color)

    expanded_mask = cv2.dilate(color_mask, np.ones((10, 10), np.uint8), iterations=1)
    color_only = cv2.bitwise_and(color_strip, color_strip, mask=color_mask)

    coords = cv2.findNonZero(color_mask)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        color_cropped = color_only[y:y+h, x:x+w]
        cropped_path = os.path.join("outputs", "color_cropped.jpg")
        cv2.imwrite(cropped_path, color_cropped)

        return {
            "status": "success",
            "message": "ประมวลผลสำเร็จ",
            "h_mean": round(h_mean, 2),
            "s_mean": round(s_mean, 2),
            "v_mean": round(v_mean, 2),
            "yellow_tip_image": yellow_tip_path,
            "color_cropped_image": cropped_path
        }
    else:
        return {
            "status": "warning",
            "message": "ไม่พบส่วนที่มีสีเพียงพอในการครอป",
            "h_mean": round(h_mean, 2),
            "s_mean": round(s_mean, 2),
            "v_mean": round(v_mean, 2),
            "yellow_tip_image": yellow_tip_path
        }
