# Layout Spec: JB Esmade Portfolio

## Global rules
- Single screen, no page scroll: `h-dvh overflow-hidden` on desktop and mobile.
- Responsive: desktop (>=1024px) and compact layouts below 1024px.
- Keep the About header compact; scale title, role, and summary text down on small screens.
- Profile animation stays left of the vertical T1–T6 tool stack at every width.
  Center the tool stack beside the profile and keep complete tool labels
  readable at a smaller mobile size. Keep the orbital skill logos visible on
  mobile and scale their ring inward to fit around the profile without
  colliding with the tools.
- Center the appointment and social buttons directly under the profile image
  on mobile and desktop instead of centering them across the whole viewport.
- Keep the transparent profile animation behind the orbital logos so it cannot
  obscure their colors.
- Bottom sheets (project image, skill info) = 33dvh tall, anchored to bottom,
  dismiss on outside tap / Esc / swipe down.
- Skills show provided logos in the orbital layout and a labeled, looping
  carousel. Both carousels scroll continuously in a seamless loop, move faster
  on desktop, use a more readable pace on mobile, and slow on pointer hover;
  selecting a skill opens its detail sheet.

## Desktop wireframe
```
+--------------------------------------------------------------+
| About JB: compact title + role + summary ("Read More")       |
|                                                              |
| [larger profile animation + orbit]                 [T1]      |
|                                                     [T2]      |
|                                                     [T3]      |
|                                                     [T4]      |
|                                                     [T5]      |
|                                                     [T6]      |
|             [Book an appointment]                               |
|             [FB] [Gmail] [Phone] [LI] [IG]                      |
| Projects >>> looping image carousel (hover slows) >>>        |
| Skills   >>> labeled looping logo carousel (hover slows) >>> |
|                                                   [Chatbot]  |
+--------------------------------------------------------------+
```

## Mobile wireframe
```
+--------------------------------+
| Compact About title / role     |
| Short summary + Read More      |
|                                |
| [profile + close orbit]  [T1]  |
|                       [T2]     |
|                       [T3]     |
|                       [T4]     |
|                       [T5]     |
|                       [T6]     |
| [Book an appointment]          |
| [FB] [Mail] [Phone] [LI] [IG]  |
| Readable-speed looping projects carousel |
| Readable-speed looping labeled skills carousel |
|                     [Chatbot]  |
+--------------------------------+
```

## Tool buttons (T1-T6, in this order)
| # | Label | Modal contents | Status |
|---|-------|----------------|--------|
| 1 | Walmart Product Hunter | (inputs/outputs) | demo / real |
| 2 | Amazon Product Hunter | ... | ... |
| 3 | SEO Website Analysis | ... | ... |
| 4 | Image Generator | ... | ... |
| 5 | Video Generator | ... | ... |
| 6 | Job Hunter | ... | ... |

## Links
- Facebook: https://www.facebook.com/brianesmade
- Gmail: https://mail.google.com/mail/?view=cm&fs=1&to=jbesmade@gmail.com
- Phone: modal showing +639559772486 with `tel:` and WhatsApp (`https://wa.me/639559772486`) buttons
- LinkedIn: https://www.linkedin.com/in/john-brian-esmade-891991328
- Instagram: TBD
- Book an Appointment: https://calendar.app.google/XobHrzracTv6pCt38
- All external links: `target="_blank" rel="noopener noreferrer"`

## Skills
| Skill | Icon | Details |
|-------|------|---------|
| SMM | `/public/skills/smm.webp` | Custom social media management |
| n8n | `/public/skills/n8n.webp` | Custom n8n workflow development and maintenance |
| Make | `/public/skills/make.webp` | Custom Make workflow development and maintenance |
| Zapier | `/public/skills/zapier.webp` | Custom Zapier workflow development and maintenance |
| GoHighLevel | `/public/skills/gohighlevel.webp` | Custom GoHighLevel workflow development and maintenance |
| Personal VA | `/public/skills/personal-va.webp` | Adaptable personal virtual assistance |
| OnlyFans Chatter | `/public/skills/onlyfans-chatter.webp` | Creator voice, audience engagement, and page growth |
| Lead Generation | `/public/skills/lead-generation.webp` | Targeted, verified B2B and B2C prospect lists |
| Walmart | `/public/skills/walmart.webp` | Walmart store management and listing optimization |
| Amazon | `/public/skills/amazon.webp` | Amazon Seller Central store management |
- Projects: image paths in /public/projects/
- Profile animation: /public/profile-animated.webp (transparent); reduced-motion still:
  /public/profile-static.webp
- Theme: (colors, fonts, dark/light)

## Carousel speed
| Carousel | Desktop | Mobile | Hover |
|----------|---------|--------|-------|
| Projects | 80 px/s | 60 px/s | 55% of normal speed |
| Skills | 72 px/s | 54 px/s | 55% of normal speed |