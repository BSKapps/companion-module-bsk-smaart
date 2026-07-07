const { combineRgb } = require('@companion-module/base')

module.exports = function updateFeedbacks(self) {
	self.setFeedbackDefinitions({
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
