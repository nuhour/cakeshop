---
name: Zen Gastronomy
colors:
  surface: '#fff8f2'
  surface-dim: '#e1d9d0'
  surface-bright: '#fff8f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2e9'
  surface-container: '#f5ede4'
  surface-container-high: '#efe7de'
  surface-container-highest: '#e9e1d8'
  on-surface: '#1e1b16'
  on-surface-variant: '#57423e'
  inverse-surface: '#34302a'
  inverse-on-surface: '#f8efe6'
  outline: '#8a716d'
  outline-variant: '#dec0bb'
  surface-tint: '#a33c2e'
  primary: '#953225'
  on-primary: '#ffffff'
  primary-container: '#b5493a'
  on-primary-container: '#ffe9e6'
  inverse-primary: '#ffb4a8'
  secondary: '#77583a'
  on-secondary: '#ffffff'
  secondary-container: '#ffd5af'
  on-secondary-container: '#795b3c'
  tertiary: '#595348'
  on-tertiary: '#ffffff'
  tertiary-container: '#726b5f'
  on-tertiary-container: '#f7edde'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#83251a'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#e7bf9a'
  on-secondary-fixed: '#2b1701'
  on-secondary-fixed-variant: '#5c4125'
  tertiary-fixed: '#ebe1d3'
  tertiary-fixed-dim: '#cfc5b8'
  on-tertiary-fixed: '#201b12'
  on-tertiary-fixed-variant: '#4c463c'
  background: '#fff8f2'
  on-background: '#1e1b16'
  surface-variant: '#e9e1d8'
typography:
  display-lg:
    fontFamily: notoSerif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  display-md:
    fontFamily: notoSerif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.08em
  headline-sm:
    fontFamily: notoSerif
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  body-lg:
    fontFamily: beVietnamPro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.02em
  body-md:
    fontFamily: beVietnamPro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-price:
    fontFamily: notoSerif
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: beVietnamPro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  margin-page: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is rooted in the "New Chinese Aesthetic," blending traditional scholarly elegance with modern minimalism. It targets a sophisticated audience that appreciates slow living, seasonal ingredients, and the poetic "Ichigo Ichie" (one time, one meeting) philosophy. 

The visual style is characterized by "Ink and Wash" clarity—prioritizing negative space (Ma-ai) to let the products breathe. It evokes a sense of calm, precision, and literary refinement through high-end textures and a disciplined color palette. 

Key attributes:
- **Poetic Zen:** Every element serves a purpose; no extraneous decoration.
- **Literary High-End:** References to calligraphy and traditional seal art.
- **Tactile Quality:** The digital interface mimics the physical properties of Xuan paper and silk.

## Colors
The palette is derived from natural pigments and traditional materials. 

- **Primary (Cinnabar Red):** Used sparingly for key actions and the brand seal. It represents vitality and authenticity.
- **Secondary (Tea Brown):** Reserved for prices and premium highlights, grounding the luxury feel.
- **Tertiary (Taupe):** Used for metadata and secondary descriptions to reduce visual noise.
- **Ink Black:** The primary text color, providing high legibility against the off-white backgrounds without the harshness of pure black.
- **Base Tones:** The background utilizes a warm Xuan paper texture (#F6F2EA), while interactive surfaces use a brighter Silk white (#FFFCF5) to create a soft, layered depth.

## Typography
The typography system relies on the contrast between the authoritative, classical **Noto Serif** (representing the shop's heritage) and the approachable, clean **Be Vietnam Pro** (for modern utility).

- **Headlines:** Must feature wide letter spacing to mimic the rhythm of traditional Chinese calligraphy. Vertical text alignment is encouraged for brand slogans.
- **Dividers:** Use the "·" (middle dot) between descriptors (e.g., "Seasonal · Organic · Handmade") rather than pipes or slashes.
- **Prices:** Rendered in Tea Brown using the serif typeface to elevate the perceived value of the dessert.

## Layout & Spacing
The layout follows a **Fixed Grid** model with generous margins to enforce a sense of "premium emptiness." 

- **Grid:** A 12-column system for desktop/tablet and a 4-column system for mobile.
- **Rhythm:** Use a 4px base unit. Vertical spacing between different menu categories should be expansive (32px+) to maintain a rhythmic flow.
- **Safe Zones:** Content is never crowded against edges. Maintain a minimum 24px side margin on mobile devices to simulate the border of a scroll or framed painting.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** rather than heavy shadows.

- **Surface Levels:** The Xuan paper background is the lowest level. Silk white cards sit atop this with a microscopic 1px border (#E8E0D0). 
- **Shadows:** If shadows are required for complex interactions, use "Ambient Shadows"—extremely low opacity (3-5%) with a warm tint (#3A3630) to avoid a "plastic" digital look.
- **Glass:** Use background blurs only for top navigation bars, simulating a semi-transparent rice paper effect that allows colors to bleed through softly as the user scrolls.

## Shapes
Shapes are disciplined and lean towards the rectangular. 

- **Softness:** A subtle 6-8px radius is applied to cards and images to take the edge off the "brutalist" geometry without making the UI look "bubbly" or childish.
- **The Seal:** The "如也" brand mark is the only exception—a perfectly sharp-cornered square (0px radius) to mimic a traditional stone-carved cinnabar seal.
- **Dividers:** Fine, horizontal hair-lines (0.5pt) should be used to separate content sections, ending 16px before the container edges.

## Components
- **Buttons:** Primary buttons are Cinnabar Red (#B5493A) with white or silk-white text. They should be rectangular with the same subtle 6px corner radius as cards. No gradients.
- **The Brand Seal:** A floating or fixed square element containing the vertical text "如也". This acts as a home trigger or a "Certified Quality" badge.
- **Cards:** Dessert item cards use the Silk white background. The image should occupy the top half, with a generous white-space margin around the text below.
- **Inputs:** Underlined fields rather than boxed containers, utilizing the Ink Black for the text and the Border Subtle color for the line.
- **Chips/Badges:** Small, rectangular tags with Tea Brown borders and Taupe text for flavor profiles (e.g., "Matcha", "Seasonal").
- **Lists:** Clean, spacious rows with the middle dot separator "·" used for secondary information.