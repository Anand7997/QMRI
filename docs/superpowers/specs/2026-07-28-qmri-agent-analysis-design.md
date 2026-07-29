# QMRI Agent Analysis Experience

## Design Intent

After an assessment is submitted, the user is invited into a focused analysis mode where QMRI Agent visibly reads their responses, explains what it is noticing, and turns the result into practical feedback.

The experience should feel like an AI robot is speaking directly to the user, while still feeling credible for an enterprise and healthcare-adjacent product. The visual energy comes from a controlled scan field around the robot, not from a dark sci-fi dashboard or an alarm-like radiation warning.

## Entry Point

Replace the result dialog action label:

`View detailed steps`

with:

`Analyse your responses by QMRI Agent`

The result dialog remains a short confirmation step. Its primary action opens a dedicated analysis page. The existing detailed report remains available after the analysis completes and from the normal Reports area.

Suggested dialog copy:

```text
Your responses are ready

Your assessment has been submitted and scored. QMRI Agent can now read your
responses, identify patterns, and prepare practical feedback for you.

[assessment title]
[score]/100

[ Analyse your responses by QMRI Agent ]
```

## Page Concept: "Analysis Chamber"

### Layout

```text
+--------------------------------------------------------------------------------+
| QMRI                                      Assessment complete / QMRI Agent     |
+--------------------------------------------------------------------------------+
|                                                                                |
|  QMRI AGENT ANALYSIS                         +-------------------------------+ |
|  Reading your responses                      | QMRI AGENT                    | |
|                                               |  ● Online                      | |
|  +---------------------------------------+    |                               | |
|  |                                       |    | "I am reading your responses | |
|  |          controlled scan field        |    |  against the QMRI maturity    | |
|  |             [ Spline robot ]         |    |  framework. I will surface   | |
|  |        ))  ))  ))  cyan scan rays    |    |  strengths and next actions  | |
|  |                                       |    |  as I go."                    | |
|  +---------------------------------------+    |                               | |
|                                               | Response 04 of 24             | |
|  Analysing response 04                        | [==========------] 42%        | |
|  Evidence and governance                      |                               | |
|                                               +-------------------------------+ |
|  [x] 01  [x] 02  [x] 03  [~] 04  [ ] 05 ...                                |
|                                                                                |
|  [ Pause analysis ]                                      [ Skip animation ]   |
+--------------------------------------------------------------------------------+
```

### Focal robot area

- Use the supplied lazy-loaded `SplineScene` wrapper for the robot.
- Keep the robot large enough to read as the primary subject: approximately 52 percent of the desktop content width, with a stable 420px minimum scene height on desktop.
- Place the Spline scene on a clean surface using the existing light palette: `#F5F9FE`, white, and Azure blue.
- Build the scan field with CSS layers around the Spline canvas:
  - three thin concentric rings with different rotation speeds;
  - a soft cyan center glow behind the robot;
  - six to eight short radial scan rays that pulse in sequence;
  - a rotating arc that sweeps the current response number;
  - a subtle dot grid or short horizontal scan lines at low opacity.
- The scan field must remain behind the robot and must not obscure its face or body.
- Avoid a red warning/radiation symbol. The visual should communicate sensing and analysis, not danger.

### Agent conversation area

The right panel is a conversation surface, not a generic log. It should look like the robot is responding to the person.

Header:

```text
QMRI Agent
Online - analysing your assessment
```

Live message sequence:

```text
I am reading your responses one by one.
```

```text
I am seeing a consistent strength in repeatable quality checks.
```

```text
I found a gap around evidence traceability. I will explain where it appears
and what to do next.
```

The active message uses a restrained typing indicator and an accessible live region. Do not simulate a long conversation when the model has not returned content; the UI should show the actual streamed or completed agent output.

### Progress and response trail

Use a compact response trail below the robot and above the bottom controls:

- completed response: check icon, muted blue background;
- active response: cyan pulse and visible label;
- queued response: neutral outline;
- failed response: warning/error icon plus a retry action.

The trail should show the current response number and category, for example:

```text
Response 04 of 24   |   Evidence and governance
```

Progress should be both visual and textual. The textual count is important for accessibility and for users who prefer a calmer interface.

## Completion State

When analysis is complete, the same page transitions into a feedback view rather than immediately redirecting away.

```text
Analysis complete
I have finished reading your responses. Here is the clearest picture I can give you.

+----------------------+  +----------------------+  +----------------------+
| Strengths             |  | Priority gaps        |  | Recommended next     |
| What is working well  |  | Where attention      |  | Actions to improve   |
|                      |  | is needed             |  |                      |
+----------------------+  +----------------------+  +----------------------+

Agent message:
"Your strongest signal is ____. The most useful next step is ____."

[ View full detailed report ]  [ Return to assessments ]
```

Use the existing maturity and answer tones for these sections:

- strengths: existing success green;
- priority gaps: existing warning amber;
- recommended next actions: existing Azure blue;
- errors or unavailable AI feedback: existing error red, with a clear fallback to the standard report.

The robot remains visible in a calmer idle state with a slow breathing light rather than the active scan rays.

## Visual System

Use the existing QMRI foundation as the base:

- background: `#F7F8FA`;
- primary Azure: `#0F6CBD`;
- deep Azure for headings: `#0B5CAD`;
- light Azure surface: `#F5F9FE`;
- cyan analysis accent: `#22D3EE`;
- body text: `#1B1B1F` and `#616167`;
- success, warning, and error colors from the existing semantic tokens.

The analysis page may use cyan as a focused accent, but it should not become a neon or purple AI screen. The robot and the response copy are the visual heroes; the surrounding UI stays quiet and readable.

Use a maximum content width of approximately 1440px. Use 8px or less corner radius for framed surfaces, with thin borders and restrained shadows consistent with the current report pages.

## Motion Rules

- Initial entry: scan field fades in over 350ms; robot scene loads through the existing Suspense loader.
- Active analysis: ring rotation is slow, rays pulse one at a time, and the current response marker moves once per response.
- Agent message: fade and slight upward reveal over 220ms; use a caret/typing indicator only while the response is genuinely pending.
- Completion: scan rays fade out, rings slow to an idle state, and insight sections reveal in sequence.
- Respect `prefers-reduced-motion`: replace rotation and pulsing with static rings and a clear text progress state.
- Provide a visible `Skip animation` action so users can move directly to the current feedback.

## Responsive Behavior

Desktop (1024px and above):

- two-column composition;
- robot/scan field on the left;
- conversation panel on the right;
- progress trail spans the lower content area.

Tablet (768px to 1023px):

- robot area remains above the conversation panel;
- reduce scene height to approximately 340px;
- keep the response count and current category visible without scrolling.

Mobile (375px and above):

- stack in this order: page title, robot/scan field, current response progress, agent conversation, response trail, controls;
- keep the robot scene between 260px and 320px tall;
- make the primary action full width;
- do not place the conversation panel beside the robot;
- keep a plain-text progress label visible even when the trail is horizontally scrollable.

## Accessibility and Trust

- Use a semantic page heading: `QMRI Agent analysis`.
- Mark live agent updates with `aria-live="polite"`; never interrupt the user with assertive announcements for normal progress.
- The progress bar includes a readable label such as `Analysing response 4 of 24`.
- All icon-only controls need accessible labels and tooltips.
- Do not use animation or color as the only signal for response state.
- Include a small trust note near the completion actions:

```text
QMRI Agent feedback is generated from your assessment responses and is intended
to support review and planning. Use the detailed report for the full evidence trail.
```

## Product Decisions To Confirm Before Implementation

1. The page should use a real analysis request and show actual response progress; the UI should not claim that each response was analysed if the backend only returns one aggregate result.
2. The detailed report remains the source of truth. QMRI Agent adds an approachable interpretation layer and next-action suggestions.
3. The first implementation should support the analysis/loading/completed/error states. Voice output, animated lip sync, and user follow-up chat can be added later without changing the core layout.
