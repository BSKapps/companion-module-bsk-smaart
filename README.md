# companion-module-bsk-smaart

Bitfocus Companion module for Rational Acoustics Smaart Suite V9 / Smaart LE V9 using the Smaart API (v4, JSON over WebSocket).

Extends the stock Smaart module set with trace capture, target curve and display toggles, per-measurement start/stop with live feedbacks, delay tracking controls, generator level nudging, status variables, and a custom keypress escape hatch.

Based on the MIT-licensed bitfocus/companion-module-rationalacoustics-smaart3 and -smaart4 modules.

See companion/HELP.md for setup and the full action list.

## Development

- `yarn` to install (use `--ignore-engines` on newer Node)
- `yarn test` to run unit tests
- `yarn build` to produce `pkg/`
- `./deploy.sh` to build and copy into the local Companion modules directory (restart Companion fully afterwards)

To package for import via Companion's "Import module package": `tar -czf bsk-smaart-<version>.tgz pkg`
