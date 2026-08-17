const { zoomKeypress } = require('./api')
function directionOption(choices, def) {
	return {
		type: 'dropdown',
		label: 'Direction',
		id: 'direction',
		default: def,
		choices,
	}
}

module.exports = function updateActions(self) {
	const measurementOption = (label, filterType) => ({
		type: 'dropdown',
		label,
		id: 'measurement',
		default: self.measurementChoices(filterType)[0]?.id ?? '',
		choices: self.measurementChoices(filterType),
		allowCustom: true,
	})

	self.setActionDefinitions({
		captureTrace: {
			name: 'Capture Trace',
			options: [measurementOption('Measurement', undefined)],
			callback: async (action, context) => {
				await self.captureTrace(await context.parseVariablesInString(action.options.measurement))
			},
		},
		renameTrace: {
			name: 'Rename Trace',
			options: [
				{
					type: 'textinput',
					label: 'Trace File Path',
					id: 'tracePath',
					useVariables: { local: true },
					required: true,
					tooltip: 'Full path and filename of the captured trace',
				},
				{
					type: 'textinput',
					label: 'New Name',
					id: 'traceName',
					useVariables: { local: true },
					required: true,
				},
			],
			callback: async (action, context) => {
				await self.renameTrace(
					await context.parseVariablesInString(action.options.tracePath),
					await context.parseVariablesInString(action.options.traceName),
				)
			},
		},
		startGenerator: {
			name: 'Start Signal Generator',
			options: [],
			callback: async () => {
				await self.setGenerator(true)
			},
		},
		toggleGenerator: {
			name: 'Toggle Signal Generator',
			options: [],
			callback: async () => {
				await self.toggleGenerator()
			},
		},
		stopGenerator: {
			name: 'Stop Signal Generator',
			options: [],
			callback: async () => {
				await self.setGenerator(false)
			},
		},
		setGeneratorLevel: {
			name: 'Set Generator Level',
			options: [
				{
					type: 'number',
					label: 'Level (dB FS)',
					id: 'level',
					min: -200,
					max: 0,
					default: -18,
					required: true,
				},
			],
			callback: async (action) => {
				await self.setGeneratorLevel(action.options.level)
			},
		},
		nudgeGeneratorLevel: {
			name: 'Adjust Generator Level',
			options: [
				{
					type: 'number',
					label: 'Amount (dB, negative = down)',
					id: 'delta',
					min: -20,
					max: 20,
					default: 1,
					required: true,
				},
			],
			callback: async (action) => {
				await self.nudgeGeneratorLevel(action.options.delta)
			},
		},
		resetAvg: {
			name: 'Reset Averages',
			options: [],
			callback: async () => {
				await self.resetAverages()
			},
		},
		startAllMeasurements: {
			name: 'Start All Measurements',
			options: [],
			callback: async () => {
				await self.setMeasurementActive('allMeasurements', true)
			},
		},
		stopAllMeasurements: {
			name: 'Stop All Measurements',
			options: [],
			callback: async () => {
				await self.setMeasurementActive('allMeasurements', false)
			},
		},
		setMeasurementActive: {
			name: 'Start/Stop Measurement',
			options: [
				measurementOption('Measurement', undefined),
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'toggle',
					choices: [
						{ id: 'on', label: 'Start' },
						{ id: 'off', label: 'Stop' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (action, context) => {
				const name = await context.parseVariablesInString(action.options.measurement)
				if (action.options.state === 'toggle') {
					await self.toggleMeasurement(name)
				} else {
					await self.setMeasurementActive(name, action.options.state === 'on')
				}
			},
		},
		startTrackingAll: {
			name: 'Start Delay Tracking (all TF measurements)',
			options: [],
			callback: async () => {
				await self.setTrackingAll(true)
			},
		},
		stopTrackingAll: {
			name: 'Stop Delay Tracking (all TF measurements)',
			options: [],
			callback: async () => {
				await self.setTrackingAll(false)
			},
		},
		toggleTrackingAll: {
			name: 'Toggle Delay Tracking (all TF measurements)',
			options: [],
			callback: async () => {
				await self.toggleTrackingAll()
			},
		},
		toggleMeasurementGroup: {
			name: 'Toggle Measurement Group (stop if any running, else start)',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'group',
					default: 'allTransferFunctionMeasurements',
					choices: [
						{ id: 'allTransferFunctionMeasurements', label: 'All transfer functions' },
						{ id: 'allSpectrumMeasurements', label: 'All spectrum measurements' },
						{ id: 'allMeasurements', label: 'All measurements' },
					],
				},
			],
			callback: async (action) => {
				await self.toggleMeasurementGroup(action.options.group)
			},
		},
		findDelay: {
			name: 'Find Delay (transfer function)',
			options: [
				measurementOption('Measurement', 'transfer function'),
				{
					type: 'checkbox',
					label: 'Start measurement automatically',
					id: 'automaticallyStart',
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Insert found delay',
					id: 'automaticallyInsert',
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Stop measurement afterwards',
					id: 'automaticallyStop',
					default: false,
				},
			],
			callback: async (action, context) => {
				const name = await context.parseVariablesInString(action.options.measurement)
				await self.findDelay(name, {
					automaticallyStart: action.options.automaticallyStart,
					automaticallyInsert: action.options.automaticallyInsert,
					automaticallyStop: action.options.automaticallyStop,
				})
			},
		},
		setDelay: {
			name: 'Set Delay (transfer function)',
			options: [
				measurementOption('Measurement', 'transfer function'),
				{
					type: 'number',
					label: 'Delay (ms, 0-1000)',
					id: 'delay',
					min: 0,
					max: 1000,
					default: 0,
					required: true,
				},
			],
			callback: async (action, context) => {
				const name = await context.parseVariablesInString(action.options.measurement)
				await self.setDelay(name, action.options.delay)
			},
		},
		setTracking: {
			name: 'Start/Stop Delay Tracking (one measurement)',
			options: [
				measurementOption('Measurement', 'transfer function'),
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Start' },
						{ id: 'off', label: 'Stop' },
					],
				},
			],
			callback: async (action, context) => {
				const name = await context.parseVariablesInString(action.options.measurement)
				await self.setTracking(name, action.options.state === 'on')
			},
		},
		cycleSplMetric: {
			name: 'Cycle SPL Readout Metric',
			options: [
				{
					type: 'multidropdown',
					label: 'Metrics to cycle',
					id: 'metrics',
					tooltip:
						'Each press steps to the next metric in this list. Drives the spl_cycle_metric and spl_cycle_value variables and the cycling zone colour feedback.',
					default: ['SPL A Slow', 'SPL C Slow', 'Leq 15'],
					choices: self.splMetricChoices(),
				},
			],
			callback: async (action) => {
				self.cycleSplMetric(action.options.metrics)
			},
		},
		splLogging: {
			name: 'SPL Logging Start/Stop',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'toggle',
					tooltip:
						'Smaart only offers a toggle, so Start and Stop check the current state first and do nothing if logging is already that way. SPL readouts only carry data while logging runs.',
					choices: [
						{ id: 'on', label: 'Start' },
						{ id: 'off', label: 'Stop' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (action) => {
				await self.setSplLogging(action.options.state)
			},
		},
		clearDbOffset: {
			name: 'Clear dB Offset (front trace only)',
			options: [],
			callback: async () => {
				await self.issueCommand('Y')
			},
		},
		clearAllDbOffsets: {
			name: 'Clear All dB Offsets',
			options: [],
			callback: async () => {
				await self.issueCommand('command + Y')
			},
		},
		frontTraceOffset: {
			name: 'Front Trace Offset Up/Down',
			options: [
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: 'up',
					tooltip: 'Nudges the dB offset of the front (top) trace only, the same as the dB +/- buttons in Smaart',
					choices: [
						{ id: 'up', label: 'Up' },
						{ id: 'down', label: 'Down' },
					],
				},
			],
			callback: async (action) => {
				await self.issueCommand('command + cursor ' + action.options.direction)
			},
		},
		toggleDataSplBar: {
			name: 'Toggle Data / SPL Meter Bar',
			options: [],
			callback: async () => {
				await self.issueCommand('option + E')
			},
		},
		resetLeq: {
			name: 'Reset SPL Leq Buffers',
			options: [],
			callback: async () => {
				await self.issueCommand('option + V')
			},
		},
		targetCurvesDialog: {
			name: 'Open Target Curves Dialog (opens another every press)',
			options: [],
			callback: async () => {
				await self.issueCommand('option + X')
			},
		},
		showTargetCurves: {
			name: 'Show/Hide Target Curves',
			options: [],
			callback: async () => {
				await self.issueCommand('X')
			},
		},
		toggleCoherence: {
			name: 'Toggle Coherence',
			options: [],
			callback: async () => {
				await self.issueCommand('C')
			},
		},
		toggleClockMeter: {
			name: 'Toggle Clock/SPL Meter',
			options: [],
			callback: async () => {
				await self.issueCommand('K')
			},
		},
		realTimeMode: {
			name: 'Real-Time Mode',
			options: [],
			callback: async () => {
				await self.issueCommand('R')
			},
		},
		impulseMode: {
			name: 'Impulse Mode',
			options: [],
			callback: async () => {
				await self.issueCommand('I')
			},
		},
		toggleSPLHistory: {
			name: 'SPL Mode',
			options: [],
			callback: async () => {
				await self.issueCommand('option + H')
			},
		},
		toggleMeters: {
			name: 'Toggle SPL Meters',
			options: [],
			callback: async () => {
				await self.issueCommand('E')
			},
		},
		toggleInputMeters: {
			name: 'Toggle Input Meters',
			options: [],
			callback: async () => {
				await self.issueCommand('shift + E')
			},
		},
		toggleInputMeterOrientation: {
			name: 'Toggle Input Meter Orientation',
			options: [],
			callback: async () => {
				await self.issueCommand('shift + option + E')
			},
		},
		selectViewPreset: {
			name: 'Select View Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'viewPreset',
					default: 'S',
					choices: self.viewPresetChoices(),
				},
			],
			callback: async (action) => {
				await self.issueCommand(action.options.viewPreset)
			},
		},
		setZoomPreset: {
			name: 'Set Zoom Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'zoomPreset',
					default: '1',
					choices: [
						{ id: '1', label: 'Zoom 1' },
						{ id: '2', label: 'Zoom 2' },
						{ id: '3', label: 'Zoom 3' },
						{ id: '4', label: 'Zoom 4' },
					],
				},
			],
			callback: async (action) => {
				await self.issueCommand('option + ' + action.options.zoomPreset)
			},
		},
		zoomX: {
			name: 'Zoom X Axis',
			options: [
				directionOption(
					[
						{ id: '+', label: 'In' },
						{ id: '-', label: 'Out' },
					],
					'+',
				),
			],
			callback: async (action) => {
				await self.issueCommand(zoomKeypress('x', action.options.direction))
			},
		},
		zoomY: {
			name: 'Zoom Y Axis',
			options: [
				directionOption(
					[
						{ id: '+', label: 'In' },
						{ id: '-', label: 'Out' },
					],
					'+',
				),
			],
			callback: async (action) => {
				await self.issueCommand(zoomKeypress('y', action.options.direction))
			},
		},
		zoomXY: {
			name: 'Zoom X and Y Axis',
			options: [
				directionOption(
					[
						{ id: '+', label: 'In' },
						{ id: '-', label: 'Out' },
					],
					'+',
				),
			],
			callback: async (action) => {
				await self.issueCommand(zoomKeypress('xy', action.options.direction))
			},
		},
		cycleZOrder: {
			name: 'Cycle Z Order',
			options: [
				directionOption(
					[
						{ id: 'forward', label: 'Forward' },
						{ id: 'backward', label: 'Backward' },
					],
					'forward',
				),
			],
			callback: async (action) => {
				await self.issueCommand(action.options.direction === 'forward' ? 'Z' : 'shift + Z')
			},
		},
		hideTrace: {
			name: 'Hide Trace',
			options: [],
			callback: async () => {
				await self.issueCommand('H')
			},
		},
		hideAllTraces: {
			name: 'Hide All Traces',
			options: [],
			callback: async () => {
				await self.issueCommand('shift + command + H')
			},
		},
		togglePeakHold: {
			name: 'Toggle Peak Hold',
			options: [],
			callback: async () => {
				await self.issueCommand('P')
			},
		},
		toggleBar: {
			name: 'Toggle Bar',
			options: [
				{
					type: 'dropdown',
					label: 'Bar',
					id: 'selectedBar',
					default: 'O',
					choices: [
						{ id: 'O', label: 'Control' },
						{ id: 'U', label: 'Command' },
						{ id: 'B', label: 'Data' },
					],
				},
			],
			callback: async (action) => {
				await self.issueCommand(action.options.selectedBar)
			},
		},
		lockCursorToPeak: {
			name: 'Lock Cursor To Peak',
			options: [],
			callback: async () => {
				await self.issueCommand('command + P')
			},
		},
		clearLockedCursor: {
			name: 'Clear Locked Cursor',
			options: [],
			callback: async () => {
				await self.issueCommand('command + X')
			},
		},
		moveLockedCursor: {
			name: 'Move Locked Cursor',
			options: [
				directionOption(
					[
						{ id: 'left', label: 'Left' },
						{ id: 'right', label: 'Right' },
					],
					'left',
				),
			],
			callback: async (action) => {
				await self.issueCommand('command + cursor ' + action.options.direction)
			},
		},
		cyclePlot: {
			name: 'Cycle Preferred Plot',
			options: [],
			callback: async () => {
				await self.issueCommand('M')
			},
		},
		runCommand: {
			name: 'Run Command (list from Smaart)',
			options: [
				{
					type: 'dropdown',
					label: 'Command',
					id: 'command',
					default: self.state.commands[0]?.keypresses?.[0] ?? '',
					choices: self.state.commands
						.filter((c, i, arr) => arr.findIndex((x) => x.keypresses[0] === c.keypresses[0]) === i)
						.map((c) => ({ id: c.keypresses[0], label: c.description })),
					allowCustom: true,
				},
			],
			callback: async (action, context) => {
				await self.issueCommand(await context.parseVariablesInString(action.options.command))
			},
		},
		triggerTimer: {
			name: 'Trigger Timer',
			options: [],
			callback: async () => {
				await self.issueCommand('shift + T')
			},
		},
		toggleQuickCompare: {
			name: 'Toggle Quick Compare',
			options: [],
			callback: async () => {
				await self.issueCommand('Q')
			},
		},
		captureQuickCompare: {
			name: 'Capture Quick Compare',
			options: [],
			callback: async () => {
				await self.issueCommand('option + Q')
			},
		},
		recaptureTrace: {
			name: 'Recapture',
			options: [],
			callback: async () => {
				await self.issueCommand('shift + command + spacebar')
			},
		},
		nudgeDelay: {
			name: 'Increase/Decrease Delay',
			options: [
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: 'increase',
					tooltip: 'Nudges the delay of the active transfer function, the same as the delay +/- buttons in Smaart',
					choices: [
						{ id: 'increase', label: 'Increase' },
						{ id: 'decrease', label: 'Decrease' },
					],
				},
			],
			callback: async (action) => {
				await self.issueCommand(action.options.direction === 'decrease' ? ',' : '.')
			},
		},
		resetMeasurementDelays: {
			name: 'Reset Measurement Delays',
			options: [],
			callback: async () => {
				await self.issueCommand('option + D')
			},
		},
		copyToAscii: {
			name: 'Copy To ASCII',
			options: [],
			callback: async () => {
				await self.issueCommand('command + C')
			},
		},
		cycleSkin: {
			name: 'Cycle Skin',
			options: [],
			callback: async () => {
				await self.issueCommand('ctrl + shift + X')
			},
		},
		customKeypress: {
			name: 'Custom Keypress',
			options: [
				{
					type: 'textinput',
					label: 'Keypress',
					id: 'keypress',
					useVariables: { local: true },
					required: true,
					tooltip: 'Smaart hotkey string, e.g. "X", "shift + Z", "option + H", "cursor up"',
				},
			],
			callback: async (action, context) => {
				await self.issueCommand(await context.parseVariablesInString(action.options.keypress))
			},
		},
	})
}
