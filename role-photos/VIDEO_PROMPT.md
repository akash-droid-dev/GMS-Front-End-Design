# Kick-to-goal video v3: goal facing the camera at the back (for Google Gemini / Veo)

The camera **faces the goal straight on**. The goal stands **at the back of the scene, front-facing**, so we see the whole goal frame and net. The player **runs in from the left**, the ball sits in front of the goal, and he shoots it **into the goal at the back**. The viewer sees the player, the ball, the net and the goal the whole time. On the site it plays **full-screen**.

Make two versions:

- **Desktop:** 16:9, 1080p, 8 s
- **Phone:** 9:16, 1080p, 8 s (same prompt plus "vertical 9:16 framing, goal and player kept in the centre")

## Main prompt

> Photorealistic, cinematic sports video, one continuous shot, locked-off camera on a tripod (no camera movement, no zoom, no cuts), at chest height. A bright, clean, pure white seamless studio with a light-grey floor and a soft blue glow on the back wall. A real, full-size white football goal stands at the back of the scene, centred and facing the camera straight on, so the whole goal frame and the fine white net are clearly visible. A white match football rests on the floor in the middle distance, centred in front of the goal, about halfway between the camera and the goal.
>
> A young South Asian footballer in a royal-blue jersey with a white number 10, white shorts, royal-blue socks and black boots runs in from the left edge of the frame toward the ball, seen in three-quarter side view so his face, body and kicking leg are clearly visible. He plants his support foot beside the ball and strikes it hard with his right foot toward the goal. Realistic body mechanics: arms out for balance, hips rotating, the kicking leg following through high.
>
> The ball travels away from the camera in a natural, slightly rising arc with realistic spin and motion blur, getting smaller as it goes, and flies into the centre of the goal. It hits the back of the net, the net bulges backward and ripples with true, physically accurate cloth motion, and the ball drops and settles inside the goal. The player then turns toward the camera and celebrates: one fist punched into the air, a joyful shout, then he holds the pose until the end.
>
> Real-time speed (not slow motion), soft high-key studio lighting, realistic soft contact shadows on the floor, everything in sharp focus, 24–30 fps, high detail. No text, no logos, no watermark, no crowd, no goalkeeper, no other people, no music.

## Timing to aim for (so the scroll story lines up)

| Time | What happens |
|---|---|
| 0–2 s | the player runs in from the left toward the ball |
| 2–2.6 s | plant and strike |
| 2.6–4 s | ball flies into the goal, the net bulges and ripples |
| 4–5 s | ball settles in the net |
| 5–8 s | the player turns to the camera, celebrates and holds |

## Composition notes (for the site's text and effects)

- Keep the **top-left area mostly clean** (plain studio wall): the heading "15 events. One arena." sits there.
- The goal is **centred at the back**, and the ball should hit the **middle of the net**: the 15 event chips will burst out from that point.
- The player stays **left of centre** for the run-up and **left of the goal** while celebrating, so he never blocks the goal.

## If the first result isn't right, add one of these lines

- **Camera moves:** "The camera is completely static on a tripod for the entire clip."
- **Goal side-on:** "The goal faces the camera directly, square to the lens, and the whole net is visible."
- **Player enters from the wrong side:** "The player enters from the left edge of the frame."
- **Ball misses:** "The ball goes into the centre of the goal and hits the back of the net."
- **Slow motion:** "Normal real-time speed throughout."
- **Grey or dark look:** "Pure white seamless studio, high-key lighting."

When both are ready, drop the .mp4 files in `role-photos/` and tell me which is which. I'll build the full-screen version.
