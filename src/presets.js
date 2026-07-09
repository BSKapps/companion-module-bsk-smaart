const { combineRgb } = require('@companion-module/base')
const { variableId, metricSlug } = require('./api')

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
	presets.startAll = preset('Measurements', 'Run All Measurements', 'RUN\\nALL', 'startAllMeasurements', {
		bgcolor: COLOR.measure,
		feedbacks: [{ feedbackId: 'anyMeasurementActive', options: {}, style: { bgcolor: COLOR.measureOn, color: WHITE } }],
	})
	presets.stopAll = preset('Measurements', 'Stop All Measurements', 'STOP\\nALL', 'stopAllMeasurements', {
		bgcolor: COLOR.measure,
	})
	presets.resetAvg = preset('Measurements', 'Reset Averages', 'RESET\\nAVG', 'resetAvg', { bgcolor: COLOR.reset })

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

	presets.targetCurves = preset('Display', 'Toggle Target Curves', 'TARGET\\nCURVES', 'showTargetCurves', {
		bgcolor: COLOR.view,
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

	presets.viewSpectrum = preset('Views', 'Spectrum View', 'SPEC', 'selectViewPreset', {
		options: { viewPreset: 'S' },
		bgcolor: COLOR.view,
	})
	presets.viewTransfer = preset('Views', 'Transfer View', 'TF', 'selectViewPreset', {
		options: { viewPreset: 'T' },
		bgcolor: COLOR.transfer,
	})
	presets.viewMulti = preset('Views', 'Multi-Spectrum View', 'MULTI\\nSPEC', 'selectViewPreset', {
		options: { viewPreset: '0' },
		bgcolor: COLOR.view,
	})
	presets.realTime = preset('Views', 'Real-Time Mode', 'RTA', 'realTimeMode', { bgcolor: COLOR.rta, color: BLACK })
	presets.impulse = preset('Views', 'Impulse Mode', 'IR', 'impulseMode', { bgcolor: COLOR.view })

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

	presets.captureTrace = preset('Traces', 'Capture Trace', 'CAP\\nTURE', 'captureTrace', {
		options: { measurement: firstMeasurement },
		bgcolor: COLOR.capture,
	})
	presets.hideTrace = preset('Traces', 'Hide Trace', 'HIDE', 'hideTrace', { bgcolor: COLOR.view })
	presets.hideAll = preset('Traces', 'Hide All Traces', 'HIDE\\nALL', 'hideAllTraces', { bgcolor: COLOR.view })
	presets.zOrder = preset('Traces', 'Cycle Z Order', 'Z\\nORDER', 'cycleZOrder', {
		options: { direction: 'forward' },
		bgcolor: COLOR.zorder,
	})

	presets.lockPeak = preset('Cursor', 'Lock Cursor To Peak', 'LOCK\\nPEAK', 'lockCursorToPeak', { bgcolor: COLOR.view })
	presets.clearLock = preset('Cursor', 'Clear Locked Cursor', 'CLEAR\\nLOCK', 'clearLockedCursor', {
		bgcolor: COLOR.view,
	})

	presets.splLoggingToggle = preset('SPL', 'SPL Logging On/Off (toggle)', 'SPL\\nLOG', 'splLogging', {
		options: { state: 'toggle' },
		bgcolor: COLOR.spl,
		feedbacks: [{ feedbackId: 'splLoggingActive', options: {}, style: { bgcolor: COLOR.splLogOn, color: WHITE } }],
	})

	const splChannel = self.state.splChannels[0]
	if (splChannel) {
		const chanSlug = variableId(splChannel.key)
		for (const metric of ['SPL A Slow', 'LAeq 15', 'Peak C']) {
			const slug = metricSlug(metric)
			presets[`spl_${slug}`] = {
				category: 'SPL',
				name: `${metric} readout`,
				type: 'button',
				style: {
					text: `${metric}\\n$(${self.label}:${slug}_${chanSlug})`,
					size: '14',
					color: WHITE,
					bgcolor: BLACK,
				},
				steps: [{ down: [], up: [] }],
				feedbacks: [{ feedbackId: 'splZone', options: { channel: splChannel.key, metric } }],
			}
		}
		presets.splTapToLog = {
			category: 'SPL',
			name: 'SPL A Slow, tap to start/stop logging',
			type: 'button',
			style: {
				text: `SPL A\\n$(${self.label}:spl_a_slow_${chanSlug})`,
				size: '18',
				color: WHITE,
				bgcolor: BLACK,
			},
			steps: [{ down: [{ actionId: 'splLogging', options: { state: 'toggle' } }], up: [] }],
			feedbacks: [{ feedbackId: 'splZone', options: { channel: splChannel.key, metric: 'SPL A Slow' } }],
		}
		presets.splAlarm = {
			category: 'SPL',
			name: 'SPL alarm',
			type: 'button',
			style: {
				text: `ALARM\\n$(${self.label}:peak_c_${chanSlug})`,
				size: '14',
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
