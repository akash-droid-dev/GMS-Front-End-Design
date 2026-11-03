# Kick-to-goal video: prompt for Google Gemini (Veo)

Generate in Gemini (Veo) at **16:9, 1080p, 8 seconds**. If you can, make a second version at **9:16** for phones, using the same prompt with "vertical 9:16 framing" added.

## Main prompt

> Photorealistic, cinematic sports video, one continuous shot with a locked-off camera (no camera movement, no zoom, no cuts), side view at hip height. A bright, clean, pure white seamless studio with a soft light-grey floor and a gentle soft blue glow in the background. On the right side of the frame stands a real, full-size white football goal with a fine white net, side-on so we can see into the net.
>
> A young South Asian footballer in a royal-blue jersey with a white number 10, white shorts, royal-blue socks and black boots enters from the left. He runs toward a white match football resting on the floor in the centre, plants his left foot beside it and strikes it hard with his right foot. Realistic body mechanics: arms out for balance, hips rotating, the kicking leg following through high.
>
> The ball flies in a natural, slightly rising arc with realistic spin and motion blur. It enters the goal and hits the back of the net, and the net bulges and ripples realistically with true physics, then the ball drops and rolls inside the goal. The player lands, turns slightly toward the goal and punches one fist in the air in celebration, then holds that pose until the end.
>
> Real-time speed (not slow motion), natural daylight-balanced studio lighting, soft realistic contact shadows on the floor, sharp focus, 24–30 fps, high detail. No text, no logos, no watermark, no crowd, no other people, no music.

## Timing to aim for (helps the scroll sync)

| Time | What happens |
|---|---|
| 0–2 s | run-up from the left |
| 2–3 s | plant and strike |
| 3–4.5 s | ball flies into the net, net bulges and ripples |
| 4.5–6 s | ball drops in the net, player celebrates |
| 6–8 s | celebration held, everything settles (I'll use this as the end frame) |

## If the first result isn't right, add one of these lines

- **Camera moves:** "The camera is completely static on a tripod for the whole clip."
- **Goal on the wrong side / player runs the wrong way:** "The player runs from left to right; the goal is on the right edge of the frame."
- **Slow motion:** "Normal real-time speed throughout."
- **Grey or dark background:** "Pure white seamless background, high-key lighting."

When it's ready, drop the .mp4 in `role-photos/` (any name). I'll trim it and turn it into a frame sequence that plays forward and backward with scroll. The "Goal!" capsule and the 15-event chip burst will play over the final frame.
