# Line Tracer Weight Sensor Simulation

A web-based simulation tool for analysing the effect of weight distribution across reflective sensors on a differential-drive line tracer robot. Visualises how varying sensor weights influence error calculation and motor PWM output in real time.

---

## Overview

Line tracer robots typically use an array of reflective sensors to detect a line on a surface. The position of the line relative to the robot is estimated by computing a **weighted average error** across all sensor readings.

This simulation models that process — allowing you to adjust sensor count, spacing, line width, line position, and per-sensor weights, then observe how those changes propagate through to motor speed modulation.

---

## Theory

### Sensor Reading Model

Each sensor samples a region of the surface. For a sensor at position $loc_i$, its reading $S_i$ is computed by integrating over its physical span:

$$S_i = \frac{1}{s_{size}} \int_{x_i^-}^{x_i^+} f(x) \, dx$$

Where the surface function $f(x)$ is:

$$f(x) = \begin{cases} \lfloor \mathcal{U}(0, 100) \rfloor & \text{if } x_{neg} < x < x_{pos} \\ 4096 & \text{otherwise} \end{cases}$$

- $x_{neg},\ x_{pos}$ are the left and right edges of the line
- $\mathcal{U}(0, 100)$ is a uniform random integer simulating sensor noise on the line
- $4096$ represents the maximum reflectance reading (off the line / white surface)

### Error Calculation

The positional error is computed as a weighted centroid across all sensors:

$$error = \frac{\sum_{n=1}^{N} sensor(n) \cdot weight(n)}{\sum_{n=1}^{N} sensor(n)}$$

### Motor Modulation

Error drives differential motor speed. Each motor's PWM is computed as:

$$PWM_{left} = \frac{Speed_{left}}{Speed_{max}} \cdot PWM_{max}$$

$$PWM_{right} = \frac{Speed_{right}}{Speed_{max}} \cdot PWM_{max}$$

### Turning Radius

Given the resulting wheel speeds, the robot's turning radius is:

$$R = \frac{V}{\omega}, \quad V = \frac{V_r + V_l}{2}, \quad \omega = \frac{V_r - V_l}{L}$$

Where $L$ is the wheelbase (distance between left and right wheels).

---

## Features

- Adjustable sensor count, size, and spacing
- Real-time sensor value visualisation with reflectance-based colour feedback
- Configurable per-sensor weights
- Line position and width control via slider
- Motor PWM bar visualisation
- Turning radius computation from differential wheel speeds
- Mathematical formula display (rendered via MathJax)

---

## Usage

Open `index.html` in a browser — no build step or server required.

### Controls

| Control | Description |
|---|---|
| Sensor Count | Number of sensors in the array |
| Sensor Size | Physical width of each sensor |
| Sensor Distance | Gap between adjacent sensors |
| Line Position | Horizontal offset of the line |
| Line Width | Width of the detected line |
| Per-sensor Weights | Influence of each sensor on the error |
| Base Speed | Robot forward speed |
| Max Modulation | Maximum PWM output cap |

---

## File Structure

```
/
├── index.html        # Main entry point
├── style.css         # Styling and layout
└── script.js         # Simulation logic
```

---

## Dependencies

- [MathJax 3](https://www.mathjax.org/) — equation rendering (loaded via CDN)

No other external dependencies.

---

## Background

This project was built to study and visualise how sensor weight distribution affects the stability and responsiveness of a weighted-average line following algorithm — a common approach in competitive line tracer robotics.
