const { variableId, metricSlug } = require('./api')

module.exports = function updateVariables(self) {
	const definitions = [
		{ variableId: 'smaart_app', name: 'Smaart application name' },
		{ variableId: 'smaart_version', name: 'Smaart version' },
		{ variableId: 'generator_active', name: 'Signal generator state' },
		{ variableId: 'generator_gain', name: 'Signal generator level (dB FS)' },
		{ variableId: 'generator_type', name: 'Signal generator type' },
		{ variableId: 'active_measurements', name: 'Number of running measurements' },
		{ variableId: 'spl_logging', name: 'SPL logging running (On/Off)' },
		{ variableId: 'spl_cycle_metric', name: 'Cycling readout: metric label shown on the button' },
		{ variableId: 'spl_cycle_value', name: 'Cycling readout: value of the current metric (dB)' },
		{ variableId: 'last_trace_path', name: 'Last captured trace file path' },
	]

	for (const m of self.state.measurements) {
		definitions.push({
			variableId: `measurement_${variableId(m.measurementName)}_active`,
			name: `${m.measurementName} running`,
		})
		if (m.type === 'transfer function') {
			definitions.push({
				variableId: `measurement_${variableId(m.measurementName)}_tracking`,
				name: `${m.measurementName} delay tracking`,
			})
			definitions.push({
				variableId: `delay_${variableId(m.measurementName)}`,
				name: `${m.measurementName} delay (ms)`,
			})
		}
	}

	for (const channel of self.state.splChannelsSeen) {
		for (const metric of self.state.splMetrics) {
			definitions.push({
				variableId: `${metricSlug(metric)}_${variableId(channel.key)}`,
				name: `${channel.channelName} (${channel.deviceName}) ${metric}`,
			})
		}
	}

	self.setVariableDefinitions(definitions)
}
