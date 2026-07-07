const { combineRgb } = require('@companion-module/base')
const { zoneForValue } = require('./api')

module.exports = function updateFeedbacks(self) {
	const splChannelOption = {
		type: 'dropdown',
		label: 'Channel',
		id: 'channel',
		default: self.splChannelChoices()[0]?.id ?? '',
		choices: self.splChannelChoices(),
	}
	const splMetricOption = {
		type: 'dropdown',
		label: 'Metric',
		id: 'metric',
		default: 'SPL A Slow',
		choices: self.splMetricChoices(),
	}

	self.setFeedbackDefinitions({
		splAbove: {
			type: 'boolean',
			name: 'SPL Above Level',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				splChannelOption,
				splMetricOption,
				{
					type: 'number',
					label: 'Level (dB)',
					id: 'level',
					min: 0,
					max: 180,
					default: 100,
					required: true,
				},
			],
			callback: (feedback) => {
				const value = self.splValue(feedback.options.channel, feedback.options.metric)
				return value !== undefined && value >= feedback.options.level
			},
		},
		splZone: {
			type: 'advanced',
			name: 'SPL Zone Colour (Smaart thresholds)',
			options: [splChannelOption, splMetricOption],
			callback: (feedback) => {
				const value = self.splValue(feedback.options.channel, feedback.options.metric)
				const zone = zoneForValue(value, self.state.splThresholds[feedback.options.metric])
				if (zone === 'red') return { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) }
				if (zone === 'yellow') return { bgcolor: combineRgb(200, 160, 0), color: combineRgb(0, 0, 0) }
				if (zone === 'green') return { bgcolor: combineRgb(0, 155, 5), color: combineRgb(255, 255, 255) }
				return {}
			},
		},
		splAlarm: {
			type: 'boolean',
			name: 'SPL Alarm Level Reached',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [splChannelOption],
			callback: (feedback) => {
				const channel = self.state.splChannels.find((c) => c.key === feedback.options.channel)
				if (!channel) return false
				return channel.alarms.some((alarm) => {
					const value = self.splValue(channel.key, alarm.metric)
					return value !== undefined && value >= alarm.level
				})
			},
		},
		generatorActive: {
			type: 'boolean',
			name: 'Signal Generator Running',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.generator.active === true,
		},
		measurementActive: {
			type: 'boolean',
			name: 'Measurement Running',
			defaultStyle: {
				bgcolor: combineRgb(0, 155, 5),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Measurement',
					id: 'measurement',
					default: self.measurementChoices()[0]?.id ?? '',
					choices: self.measurementChoices(),
					allowCustom: true,
				},
			],
			callback: async (feedback, context) => {
				const name = await context.parseVariablesInString(feedback.options.measurement)
				const m = self.state.measurements.find((m) => m.measurementName === name)
				return m?.active === true
			},
		},
		anyMeasurementActive: {
			type: 'boolean',
			name: 'Any Measurement Running',
			defaultStyle: {
				bgcolor: combineRgb(0, 155, 5),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.measurements.some((m) => m.active),
		},
		trackingActive: {
			type: 'boolean',
			name: 'Delay Tracking Running',
			defaultStyle: {
				bgcolor: combineRgb(0, 100, 200),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Measurement',
					id: 'measurement',
					default: self.measurementChoices('transfer function')[0]?.id ?? '',
					choices: self.measurementChoices('transfer function'),
					allowCustom: true,
				},
			],
			callback: async (feedback, context) => {
				const name = await context.parseVariablesInString(feedback.options.measurement)
				const m = self.state.measurements.find((m) => m.measurementName === name)
				return m?.trackingDelay === true
			},
		},
	})
}
