const { combineRgb } = require('@companion-module/base')
const { variableId, metricSlug, shortMetricLabel } = require('./api')

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)

const COLOR = {
	generator: combineRgb(90, 35, 150),
	generatorOn: combineRgb(165, 40, 215),
	track: combineRgb(0, 115, 115),
	trackOn: combineRgb(0, 110, 210),
	bar: combineRgb(35, 70, 205),
	meter: combineRgb(0, 130, 60),
	meterOn: combineRgb(0, 165, 10),
	measure: combineRgb(25, 85, 50),
	measureOn: combineRgb(0, 165, 10),
	reset: combineRgb(0, 130, 60),
	rta: combineRgb(205, 180, 0),
	transfer: combineRgb(215, 110, 0),
	spl: combineRgb(185, 0, 0),
	splLogOn: combineRgb(0, 165, 10),
	peak: combineRgb(205, 0, 185),
	zorder: combineRgb(90, 35, 150),
	capture: combineRgb(0, 95, 165),
	view: combineRgb(60, 60, 72),
	zoom: combineRgb(35, 35, 44),
	neutral: combineRgb(45, 45, 55),
	alarm: combineRgb(190, 0, 0),
}

function preset(category, name, text, actionId, opts = {}) {
	const { options = {}, bgcolor = COLOR.neutral, color = WHITE, size = '14', feedbacks = [] } = opts
	return {
		category,
		name,
		type: 'button',
		style: { text, size, color, bgcolor },
		steps: [{ down: actionId ? [{ actionId, options }] : [], up: [] }],
		feedbacks,
	}
}

module.exports = function updatePresets(self) {
	const presets = {}
	const firstMeasurement = self.measurementChoices()[0]?.id ?? ''

	presets.generatorToggle = preset('Generator', 'Generator On/Off (toggle)', 'GEN\\nON/OFF', 'toggleGenerator', {
		bgcolor: COLOR.generator,
		feedbacks: [{ feedbackId: 'generatorActive', options: {}, style: { bgcolor: COLOR.generatorOn, color: WHITE } }],
	})
	presets.startGenerator = preset('Generator', 'Start Generator', 'GEN\\nON', 'startGenerator', {
		bgcolor: COLOR.generator,
		feedbacks: [{ feedbackId: 'generatorActive', options: {}, style: { bgcolor: COLOR.generatorOn, color: WHITE } }],
	})
	presets.stopGenerator = preset('Generator', 'Stop Generator', 'GEN\\nOFF', 'stopGenerator', {
		bgcolor: COLOR.generator,
	})
	presets.genUp = preset('Generator', 'Generator +1 dB', 'GEN\\n+1dB', 'nudgeGeneratorLevel', {
		options: { delta: 1 },
		bgcolor: COLOR.generator,
	})
	presets.genDown = preset('Generator', 'Generator -1 dB', 'GEN\\n-1dB', 'nudgeGeneratorLevel', {
		options: { delta: -1 },
		bgcolor: COLOR.generator,
	})

	presets.runMeasurement = preset('Measurements', 'Run Measurement (toggle, pick one)', 'RUN', 'setMeasurementActive', {
		options: { measurement: firstMeasurement, state: 'toggle' },
		bgcolor: COLOR.measure,
		feedbacks: [
			{
				feedbackId: 'measurementActive',
				options: { measurement: firstMeasurement },
				style: { bgcolor: COLOR.measureOn, color: WHITE },
			},
		],
	})
	presets.runTFsToggle = preset('Measurements', 'Run TFs On/Off (toggle)', 'RUN\\nTFs', 'toggleMeasurementGroup', {
		options: { group: 'allTransferFunctionMeasurements' },
		bgcolor: COLOR.measure,
		feedbacks: [{ feedbackId: 'anyTFActive', options: {}, style: { bgcolor: COLOR.measureOn, color: WHITE } }],
	})
	presets.runSpecToggle = preset(
		'Measurements',
		'Run Spectrum On/Off (toggle)',
		'RUN\\nSPECT',
		'toggleMeasurementGroup',
		{
			options: { group: 'allSpectrumMeasurements' },
			bgcolor: COLOR.measure,
			feedbacks: [{ feedbackId: 'anySpectrumActive', options: {}, style: { bgcolor: COLOR.measureOn, color: WHITE } }],
		},
	)
	presets.startTFs = preset('Measurements', 'Start All Transfer Functions', 'TFs\\nON', 'setMeasurementActive', {
		options: { measurement: 'allTransferFunctionMeasurements', state: 'on' },
		bgcolor: COLOR.measure,
		feedbacks: [{ feedbackId: 'anyTFActive', options: {}, style: { bgcolor: COLOR.measureOn, color: WHITE } }],
	})
	presets.stopTFs = preset('Measurements', 'Stop All Transfer Functions', 'TFs\\nOFF', 'setMeasurementActive', {
		options: { measurement: 'allTransferFunctionMeasurements', state: 'off' },
		bgcolor: COLOR.measure,
	})
	presets.startSpec = preset('Measurements', 'Start All Spectrum Measurements', 'SPECT\\nON', 'setMeasurementActive', {
		options: { measurement: 'allSpectrumMeasurements', state: 'on' },
		bgcolor: COLOR.measure,
		feedbacks: [{ feedbackId: 'anySpectrumActive', options: {}, style: { bgcolor: COLOR.measureOn, color: WHITE } }],
	})
	presets.stopSpec = preset('Measurements', 'Stop All Spectrum Measurements', 'SPECT\\nOFF', 'setMeasurementActive', {
		options: { measurement: 'allSpectrumMeasurements', state: 'off' },
		bgcolor: COLOR.measure,
	})
	presets.startAll = preset('Measurements', 'Run All Measurements', 'RUN\\nALL', 'startAllMeasurements', {
		bgcolor: COLOR.measure,
		feedbacks: [{ feedbackId: 'anyMeasurementActive', options: {}, style: { bgcolor: COLOR.measureOn, color: WHITE } }],
	})
	presets.stopAll = preset('Measurements', 'Stop All Measurements', 'STOP\\nALL', 'stopAllMeasurements', {
		bgcolor: COLOR.measure,
	})
	presets.resetAvg = preset('Measurements', 'Reset Averages', 'RESET\\nAVERAGE', 'resetAvg', { bgcolor: COLOR.reset })

	presets.trackingToggle = preset('Delay', 'Delay Tracking On/Off (toggle)', 'TRACK\\nON/OFF', 'toggleTrackingAll', {
		bgcolor: COLOR.track,
		feedbacks: [{ feedbackId: 'anyTrackingActive', options: {}, style: { bgcolor: COLOR.trackOn, color: WHITE } }],
	})
	presets.trackAllStart = preset('Delay', 'Start Delay Tracking', 'TRACK\\nON', 'startTrackingAll', {
		bgcolor: COLOR.track,
		feedbacks: [{ feedbackId: 'anyTrackingActive', options: {}, style: { bgcolor: COLOR.trackOn, color: WHITE } }],
	})
	presets.trackAllStop = preset('Delay', 'Stop Delay Tracking', 'TRACK\\nOFF', 'stopTrackingAll', {
		bgcolor: COLOR.track,
	})
	presets.findDelay = preset('Delay', 'Find Delay (pick a TF measurement)', 'FIND\\nDELAY', 'findDelay', {
		options: {
			measurement: self.measurementChoices('transfer function')[0]?.id ?? '',
			automaticallyStart: true,
			automaticallyInsert: true,
			automaticallyStop: false,
		},
		bgcolor: COLOR.track,
	})

	presets.targetCurves = preset('Display', 'Toggle Target Curves', 'TARGET\\nCURVES', 'showTargetCurves', {
		bgcolor: COLOR.view,
	})
	presets.targetCurvesDialog = preset('Display', 'Target Curves Dialog', 'TARGET\\nPICKER', 'targetCurvesDialog', {
		bgcolor: COLOR.view,
	})
	presets.dataSplBar = preset('Display', 'Toggle Data/SPL Meter Bar', 'DATA\\nSPL', 'toggleDataSplBar', {
		bgcolor: COLOR.bar,
	})
	presets.coherence = preset('Display', 'Toggle Coherence', 'COH', 'toggleCoherence', { bgcolor: COLOR.view })
	presets.peakHold = preset('Display', 'Toggle Peak Hold', 'PEAK\\nHOLD', 'togglePeakHold', { bgcolor: COLOR.peak })
	presets.splMeters = preset('Display', 'Toggle SPL Meters', 'SPL\\nMETERS', 'toggleMeters', { bgcolor: COLOR.meter })
	presets.inputMeters = preset('Display', 'Toggle Input Meters', 'INPUT\\nMETERS', 'toggleInputMeters', {
		bgcolor: COLOR.meter,
	})
	presets.clockMeter = preset('Display', 'Toggle Clock/SPL Meter', 'CLOCK\\nSPL', 'toggleClockMeter', {
		bgcolor: COLOR.view,
	})
	presets.dataBar = preset('Display', 'Toggle Data Bar', 'DATA\\nBAR', 'toggleBar', {
		options: { selectedBar: 'B' },
		bgcolor: COLOR.bar,
	})
	presets.controlBar = preset('Display', 'Toggle Control Bar', 'CTRL\\nBAR', 'toggleBar', {
		options: { selectedBar: 'O' },
		bgcolor: COLOR.bar,
	})
	presets.commandBar = preset('Display', 'Toggle Command Bar', 'CMD\\nBAR', 'toggleBar', {
		options: { selectedBar: 'U' },
		bgcolor: COLOR.bar,
	})

	presets.viewSpectrum = preset('Views', 'RTA (Spectrum) View', 'RTA', 'selectViewPreset', {
		options: { viewPreset: 'S' },
		bgcolor: COLOR.rta,
		color: BLACK,
	})
	presets.viewTransfer = preset('Views', 'Transfer View', 'TF', 'selectViewPreset', {
		options: { viewPreset: 'T' },
		bgcolor: COLOR.transfer,
	})
	presets.viewMulti = preset('Views', 'Multi-Spectrum View', 'MULTI\\nSPECT', 'selectViewPreset', {
		options: { viewPreset: '0' },
		bgcolor: COLOR.view,
	})
	presets.realTime = preset('Views', 'Real-Time Mode', 'RT\\nMODE', 'realTimeMode', { bgcolor: COLOR.view })
	presets.impulse = preset('Views', 'Impulse Mode', 'IMPULSE\\nMODE', 'impulseMode', { bgcolor: COLOR.view })
	presets.viewFlip = {
		category: 'Views',
		name: 'TF/RTA view (alternates each press)',
		type: 'button',
		style: { text: 'TF /\\nRTA', size: '14', color: WHITE, bgcolor: COLOR.transfer },
		steps: [
			{ down: [{ actionId: 'selectViewPreset', options: { viewPreset: 'T' } }], up: [] },
			{ down: [{ actionId: 'selectViewPreset', options: { viewPreset: 'S' } }], up: [] },
		],
		feedbacks: [],
	}

	for (const n of ['1', '2', '3', '4']) {
		presets[`zoom${n}`] = preset('Zoom', `Zoom Preset ${n}`, `ZOOM\\n${n}`, 'setZoomPreset', {
			options: { zoomPreset: n },
			bgcolor: COLOR.zoom,
		})
	}
	presets.zoomInY = preset('Zoom', 'Zoom In Y', 'ZOOM\\nIN Y', 'zoomY', {
		options: { direction: '+' },
		bgcolor: COLOR.zoom,
	})
	presets.zoomOutY = preset('Zoom', 'Zoom Out Y', 'ZOOM\\nOUT Y', 'zoomY', {
		options: { direction: '-' },
		bgcolor: COLOR.zoom,
	})
	presets.zoomInX = preset('Zoom', 'Zoom In X', 'ZOOM\\nIN X', 'zoomX', {
		options: { direction: '+' },
		bgcolor: COLOR.zoom,
	})
	presets.zoomOutX = preset('Zoom', 'Zoom Out X', 'ZOOM\\nOUT X', 'zoomX', {
		options: { direction: '-' },
		bgcolor: COLOR.zoom,
	})
	presets.zoomInXY = preset('Zoom', 'Zoom In X+Y', 'ZOOM\\nIN X+Y', 'zoomXY', {
		options: { direction: '+' },
		bgcolor: COLOR.zoom,
	})
	presets.zoomOutXY = preset('Zoom', 'Zoom Out X+Y', 'ZOOM\\nOUT X+Y', 'zoomXY', {
		options: { direction: '-' },
		bgcolor: COLOR.zoom,
	})

	presets.captureTrace = preset('Traces', 'Capture Trace', 'CAPTURE\\nTRACE', 'captureTrace', {
		options: { measurement: firstMeasurement },
		bgcolor: COLOR.capture,
	})
	presets.captureAll = preset('Traces', 'Capture All Active Measurements', 'CAPTURE\\nALL', 'captureTrace', {
		options: { measurement: 'allMeasurements' },
		bgcolor: COLOR.capture,
	})
	presets.captureTFs = preset('Traces', 'Capture All Active Transfer Functions', 'CAPTURE\\nTFs', 'captureTrace', {
		options: { measurement: 'allTransferFunctionMeasurements' },
		bgcolor: COLOR.capture,
	})
	presets.captureSpec = preset(
		'Traces',
		'Capture All Active Spectrum Measurements',
		'CAPTURE\\nSPECT',
		'captureTrace',
		{
			options: { measurement: 'allSpectrumMeasurements' },
			bgcolor: COLOR.capture,
		},
	)
	presets.hideTrace = preset('Traces', 'Hide Trace', 'HIDE', 'hideTrace', { bgcolor: COLOR.view })
	presets.hideAll = preset('Traces', 'Hide All Traces', 'HIDE\\nALL', 'hideAllTraces', { bgcolor: COLOR.view })
	presets.zOrder = preset('Traces', 'Cycle Z Order', 'Z\\nORDER', 'cycleZOrder', {
		options: { direction: 'forward' },
		bgcolor: COLOR.zorder,
	})
	presets.traceUp = preset('Traces', 'Front Trace Offset Up', 'TRACE\\nUP', 'frontTraceOffset', {
		options: { direction: 'up' },
		bgcolor: COLOR.zorder,
	})
	presets.traceDown = preset('Traces', 'Front Trace Offset Down', 'TRACE\\nDOWN', 'frontTraceOffset', {
		options: { direction: 'down' },
		bgcolor: COLOR.zorder,
	})
	presets.clearDbOffset = preset('Traces', 'Clear dB Offset (front trace)', 'CLEAR\\ndB', 'clearDbOffset', {
		bgcolor: COLOR.zorder,
	})
	presets.clearAllDbOffsets = preset('Traces', 'Clear All dB Offsets', 'CLEAR\\nALL dB', 'clearAllDbOffsets', {
		bgcolor: COLOR.zorder,
	})

	presets.lockPeak = preset('Cursor', 'Lock Cursor To Peak', 'LOCK\\nPEAK', 'lockCursorToPeak', { bgcolor: COLOR.view })
	presets.clearLock = preset('Cursor', 'Clear Locked Cursor', 'CLEAR\\nLOCK', 'clearLockedCursor', {
		bgcolor: COLOR.view,
	})

	presets.resetLeq = preset('SPL', 'Reset SPL Leq Buffers', 'RESET\\nLEQ', 'resetLeq', { bgcolor: COLOR.reset })
	presets.splLoggingToggle = preset('SPL', 'SPL Logging On/Off (toggle)', 'SPL\\nLOG', 'splLogging', {
		options: { state: 'toggle' },
		bgcolor: COLOR.spl,
		feedbacks: [{ feedbackId: 'splLoggingActive', options: {}, style: { bgcolor: COLOR.splLogOn, color: WHITE } }],
	})

	const splChannel = self.splPresetChannel()
	if (splChannel) {
		const chanSlug = variableId(splChannel.key)
		const metrics = self.state.splMetrics.length ? self.state.splMetrics : ['SPL A Slow', 'LAeq 15', 'Peak C']
		for (const metric of metrics) {
			const slug = metricSlug(metric)
			const label = shortMetricLabel(metric)
			presets[`spl_${slug}`] = {
				category: 'SPL',
				name: `${metric} readout, tap to start/stop logging`,
				type: 'button',
				style: {
					text: `\`${label}\n\${$(${self.label}:spl_logging) == 'On' ? $(${self.label}:${slug}_${chanSlug}) : 'TAP'}\``,
					textExpression: true,
					size: '18',
					color: WHITE,
					bgcolor: BLACK,
				},
				steps: [{ down: [{ actionId: 'splLogging', options: { state: 'toggle' } }], up: [] }],
				feedbacks: [{ feedbackId: 'splZone', options: { channel: splChannel.key, metric } }],
			}
		}
		presets.splCycle = {
			category: 'SPL',
			name: 'Cycling readout (press to change metric, never starts or stops logging)',
			type: 'button',
			style: {
				text: `$(${self.label}:spl_cycle_metric) == '' ? 'TAP' : \`\${$(${self.label}:spl_cycle_metric)}\n\${$(${self.label}:spl_cycle_value)}\``,
				textExpression: true,
				size: '18',
				color: WHITE,
				bgcolor: COLOR.neutral,
			},
			steps: [
				{
					down: [{ actionId: 'cycleSplMetric', options: { metrics: ['SPL A Slow', 'SPL C Slow', 'Leq 15'] } }],
					up: [],
				},
			],
			feedbacks: [{ feedbackId: 'splCycleZone', options: { channel: splChannel.key } }],
		}
		presets.splAlarm = {
			category: 'SPL',
			name: 'SPL alarm',
			type: 'button',
			style: {
				text: `ALARM\\n$(${self.label}:peak_c_${chanSlug})`,
				size: '18',
				color: WHITE,
				bgcolor: BLACK,
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'splAlarm',
					options: { channel: splChannel.key },
					style: { bgcolor: COLOR.alarm, color: WHITE },
				},
			],
		}
	}

	self.setPresetDefinitions(presets)
}
