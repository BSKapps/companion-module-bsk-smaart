const { combineRgb } = require('@companion-module/base')

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)

function button(category, name, text, actionId, options = {}, feedbacks = []) {
	return {
		category,
		name,
		type: 'button',
		style: {
			text,
			size: '14',
			color: WHITE,
			bgcolor: BLACK,
		},
		steps: [
			{
				down: [{ actionId, options }],
				up: [],
			},
		],
		feedbacks,
	}
}

module.exports = function updatePresets(self) {
	const presets = {}

	presets.captureTrace = button('Capture', 'Capture Trace', 'CAPTURE', 'captureTrace', {
		measurement: self.measurementChoices()[0]?.id ?? '',
	})

	presets.startGenerator = button('Generator', 'Start Generator', 'GEN\\nON', 'startGenerator', {}, [
		{
			feedbackId: 'generatorActive',
			options: {},
			style: { bgcolor: combineRgb(200, 0, 0), color: WHITE },
		},
	])
	presets.stopGenerator = button('Generator', 'Stop Generator', 'GEN\\nOFF', 'stopGenerator')
	presets.genUp = button('Generator', 'Generator +1 dB', 'GEN\\n+1dB', 'nudgeGeneratorLevel', { delta: 1 })
	presets.genDown = button('Generator', 'Generator -1 dB', 'GEN\\n-1dB', 'nudgeGeneratorLevel', { delta: -1 })

	presets.startAll = button('Measurements', 'Start All Measurements', 'RUN\\nALL', 'startAllMeasurements', {}, [
		{
			feedbackId: 'anyMeasurementActive',
			options: {},
			style: { bgcolor: combineRgb(0, 155, 5), color: WHITE },
		},
	])
	presets.stopAll = button('Measurements', 'Stop All Measurements', 'STOP\\nALL', 'stopAllMeasurements')
	presets.resetAvg = button('Measurements', 'Reset Averages', 'RESET\\nAVG', 'resetAvg')

	presets.trackAllStart = button('Delay', 'Start Delay Tracking', 'TRACK\\nON', 'startTrackingAll')
	presets.trackAllStop = button('Delay', 'Stop Delay Tracking', 'TRACK\\nOFF', 'stopTrackingAll')

	presets.targetCurves = button('Display', 'Toggle Target Curves', 'TARGET\\nCURVES', 'showTargetCurves')
	presets.coherence = button('Display', 'Toggle Coherence', 'COH', 'toggleCoherence')
	presets.peakHold = button('Display', 'Toggle Peak Hold', 'PEAK\\nHOLD', 'togglePeakHold')
	presets.splMeters = button('Display', 'Toggle SPL Meters', 'SPL\\nMETERS', 'toggleMeters')
	presets.inputMeters = button('Display', 'Toggle Input Meters', 'INPUT\\nMETERS', 'toggleInputMeters')
	presets.clockMeter = button('Display', 'Toggle Clock/SPL Meter', 'CLOCK\\nSPL', 'toggleClockMeter')

	presets.viewSpectrum = button('Views', 'Spectrum View', 'SPEC', 'selectViewPreset', { viewPreset: 'S' })
	presets.viewTransfer = button('Views', 'Transfer View', 'TF', 'selectViewPreset', { viewPreset: 'T' })
	presets.viewMulti = button('Views', 'Multi-Spectrum View', 'MULTI\\nSPEC', 'selectViewPreset', { viewPreset: '0' })
	presets.realTime = button('Views', 'Real-Time Mode', 'RTA\\nMODE', 'realTimeMode')
	presets.impulse = button('Views', 'Impulse Mode', 'IR\\nMODE', 'impulseMode')

	presets.hideTrace = button('Traces', 'Hide Trace', 'HIDE', 'hideTrace')
	presets.hideAll = button('Traces', 'Hide All Traces', 'HIDE\\nALL', 'hideAllTraces')
	presets.zOrder = button('Traces', 'Cycle Z Order', 'Z\\nORDER', 'cycleZOrder', { direction: 'forward' })

	self.setPresetDefinitions(presets)
}
