const { variableId } = require('./api')

module.exports = function updateVariables(self) {
	const definitions = [
		{ variableId: 'smaart_app', name: 'Smaart application name' },
		{ variableId: 'smaart_version', name: 'Smaart version' },
		{ variableId: 'generator_active', name: 'Signal generator state' },
		{ variableId: 'generator_gain', name: 'Signal generator level (dB FS)' },
		{ variableId: 'generator_type', name: 'Signal generator type' },
		{ variableId: 'active_measurements', name: 'Number of running measurements' },
	]

	for (const m of self.state.measurements) {
		definitions.push({
			variableId: `measurement_${variableId(m.measurementName)}_active`,
			name: `${m.measurementName} running`,
		})
		if (m.type === 'transfer function') {
			definitions.push({
				variableId: `delay_${variableId(m.measurementName)}`,
				name: `${m.measurementName} delay (ms)`,
			})
		}
	}

	self.setVariableDefinitions(definitions)
}
