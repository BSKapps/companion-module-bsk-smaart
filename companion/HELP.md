# BSK Apps: Smaart Control

Controls Rational Acoustics Smaart Suite V9 / Smaart LE V9 over the Smaart API.

## Setup

1. In Smaart, open Options > Preferences > API.
2. Tick Enabled and note the port (default 26000). Set a password if you want authentication.
3. In this connection's settings, enter the IP or hostname of the Smaart machine, the port, and the password if one is set.

Smaart does not need to be the front application. Commands go over the network, so buttons work while other apps have focus, and Smaart can run on a different computer.

## Actions

- Capture Trace: captures the selected measurement, no focus needed. Rename Trace can rename a captured trace file afterwards.
- Signal generator: start, stop, set level, and adjust level up or down in dB steps.
- Measurements: start or stop all measurements, or start/stop/toggle a single measurement picked from a list read live from Smaart.
- Delay tracking: start or stop for all transfer function measurements or a single one.
- Reset Averages.
- SPL Logging Start/Stop: starts, stops, or toggles SPL logging, which is what makes the live SPL variables available.
- Display toggles: target curves, coherence, peak hold, SPL meters, SPL mode, input meters, clock/SPL meter, bars.
- Views: spectrum, transfer, user views 1-9, multi-spectrum, real-time and impulse modes, zoom presets 1-4 and zoom in/out.
- Traces: hide, hide all, Z order, locked cursor controls.
- Custom Keypress: send any Smaart hotkey string, e.g. "shift + Z" or "cursor up", for anything not covered above.

## Live SPL meters

While SPL logging is running in Smaart, every calibrated input channel streams its meter values to Companion: SPL Fast/Slow (Z, A, and C weighted), Leq/LAeq/LCeq over 1, 15, and 60 minutes, Peak/Peak A/Peak C, FS Peak, and exposure. Each value is a variable you can put on a button, updated at the configurable rate (default twice per second). Start SPL logging in Smaart, or from the surface with the SPL Logging Start/Stop action, to activate them; the channels appear automatically. SPL values are only available while logging runs, so the readout buttons blank out when logging stops.

## Feedbacks

- Signal Generator Running: button lights while the generator is on.
- Measurement Running / Any Measurement Running.
- Delay Tracking Running.
- SPL Above Level: lights when a chosen metric on a chosen channel reaches a level you set.
- SPL Zone Colour: colours the button green/yellow/red using the thresholds configured in Smaart.
- SPL Alarm Level Reached: lights when a channel hits an alarm level configured in Smaart.

## Variables

- Smaart application name and version.
- Generator state, level, and signal type.
- Number of running measurements.
- Per measurement: running state, and delay in ms for transfer function measurements.
- Per calibrated channel while SPL logging runs: all SPL meter metrics listed above.

## Notes

Actions that change what is drawn on screen (views, zoom, toggles) act on the active Smaart window, same as pressing the hotkey in Smaart.
