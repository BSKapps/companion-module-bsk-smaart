# BSK Apps: Smaart Control

Controls Rational Acoustics Smaart V9 over the Smaart API. Control actions work on Smaart Suite, RT, and LE. Live SPL metering works on Smaart Suite and the Smaart SPL edition.

## Setup

1. In Smaart, open Options > Preferences > API.
2. Tick Enabled and note the port (default 26000). Set a password if you want authentication.
3. In this connection's settings, enter the IP or hostname of the Smaart machine, the port, and the password if one is set.

Smaart does not need to be the front application. Commands go over the network, so buttons work while other apps have focus, and Smaart can run on a different computer.

## Actions

- Capture Trace: captures the selected measurement, or all active measurements using the group names, no focus needed. The captured file path lands in the last captured trace variable, so Rename Trace can rename it afterwards.
- Signal generator: start, stop, toggle, set level, and adjust level up or down in dB steps.
- Measurements: start or stop all measurements, toggle a group (all transfer functions, all spectrum, or everything), or start/stop/toggle a single measurement picked from a list read live from Smaart.
- Delay tracking: start, stop, or toggle for all transfer function measurements or a single one.
- Find Delay: runs Smaart's delay finder on a transfer function measurement, with options to start the measurement automatically, insert the found delay, and stop afterwards.
- Set Delay: sets a transfer function measurement's delay in ms directly.
- Reset Averages.
- Clear dB Offset / Clear All dB Offsets: clears the front trace's dB offset, or every trace's.
- Front Trace Offset Up/Down: nudges the front trace's dB offset, the same as Smaart's dB +/- buttons.
- Toggle Data / SPL Meter Bar: flips the left bar between the Data Library and the SPL meters.
- Reset SPL Leq Buffers.
- Open Target Curves Dialog: opens Smaart's target curve picker, as opposed to Show/Hide Target Curves which just shows or hides them.
- Cycle SPL Readout Metric: steps a readout button through a list of metrics you choose.
- SPL Logging Start/Stop: starts, stops, or toggles SPL logging, which is what makes the live SPL variables available.
- Display toggles: target curves, coherence, peak hold, SPL meters, SPL mode, input meters, clock/SPL meter, bars.
- Views: spectrum, transfer, the numbered view presets, real-time and impulse modes, zoom presets 1-4 and zoom in/out. The view preset list is read from Smaart, so it shows your own view names and hides empty slots. These change the layout inside the current tab; the API cannot switch between tabs.
- Traces: hide, hide all, Z order, locked cursor controls.
- Run Command: pick any command from a list Smaart reports over the API, so you do not need to know the hotkey.
- Custom Keypress: send any Smaart hotkey string, e.g. "shift + Z" or "cursor up", for anything not covered above.

## Live SPL meters

Live SPL metering works on Smaart Suite and the Smaart SPL edition. Smaart LE and RT do not expose SPL over the API, so the SPL variables and feedbacks stay empty on those editions.

While SPL logging is running in Smaart, every calibrated input channel streams its meter values to Companion: SPL Fast/Slow (Z, A, and C weighted), Leq/LAeq/LCeq over the configured periods, Peak/Peak C, FS Peak, and exposure. Each value is a variable you can put on a button, updated at the configurable rate (up to 8 per second, default 2). Start SPL logging in Smaart, or from the surface with the SPL Logging Start/Stop action, to activate them; the channels appear automatically. SPL values are only available while logging runs, so the readout buttons blank out when logging stops. The SPL Alarm feedback follows the alarm levels you set in Smaart.

Every metric gets a preset, and they live in their own SPL Readouts group so they do not bury the SPL controls. Each one is a self-contained button: it reads TAP while logging is off, press to start, then it shows the live level coloured by Smaart's thresholds, and press again to stop. If you want a display-only readout, drop the preset on a button and delete its action.

There is also a cycling readout: each press steps it to the next metric in a list you choose, so one button can cover several metrics. It is the one SPL readout that never starts or stops logging, and it sits on a lighter background in the presets list so you can tell it apart from the rest.

Once Companion has seen your calibrated channels for the first time, it remembers them, so the SPL presets, variables and feedback dropdowns stay available even when logging is stopped. Before that first logging run there is nothing for Smaart to report, so start logging once to populate them.

## Feedbacks

- Signal Generator Running: button lights while the generator is on.
- Measurement Running / Any Measurement Running / Any Transfer Function Running / Any Spectrum Measurement Running.
- Delay Tracking Running / Any Delay Tracking Running.
- SPL Above Level: lights when a chosen metric on a chosen channel reaches a level you set.
- SPL Zone Colour: colours the button green/yellow/red using the thresholds configured in Smaart.
- SPL Zone Colour (cycling readout): the same, but follows whichever metric the cycling readout is currently showing.
- SPL Alarm Level Reached: lights when a channel hits an alarm level configured in Smaart.

## Variables

- Smaart application name and version.
- Generator state, level, and signal type.
- Number of running measurements.
- Last captured trace file path, filled in by Capture Trace and usable with Rename Trace.
- Per measurement: running state, plus delay tracking state and delay in ms for transfer function measurements.
- Per calibrated channel while SPL logging runs: all SPL meter metrics listed above.
- Cycling readout: the metric label currently shown and its value.

## Notes

Actions that change what is drawn on screen (views, zoom, toggles) act on the active Smaart window, same as pressing the hotkey in Smaart.

The TF/RTA preset alternates on each press. The API does not report which view is currently showing, so if you switch views in Smaart itself, the button's next press sends the other command; press it again to re-sync.
