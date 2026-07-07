const errors = [
	{ id: 'parse error', description: 'Smaart could not parse the request', logLevel: 'warn' },
	{ id: 'timeout', description: 'Smaart timed out carrying out the request', logLevel: 'warn' },
	{
		id: 'unknown target',
		description: 'Target not recognized (misspelled, or measurement not in the active tab/window)',
		logLevel: 'warn',
	},
	{ id: 'unknown action', description: 'Action not recognized by the target', logLevel: 'warn' },
	{ id: 'unkown property', description: 'Property does not apply to the target', logLevel: 'warn' },
	{ id: 'unknown property', description: 'Property does not apply to the target', logLevel: 'warn' },
	{ id: 'unknown value', description: 'Value does not apply to the property', logLevel: 'warn' },
	{ id: 'read only', description: 'Attempt to set a read-only property', logLevel: 'warn' },
	{ id: 'not implemented', description: 'Request not implemented by Smaart', logLevel: 'warn' },
	{
		id: 'signal generator required',
		description: 'Measurement requires the signal generator to be active',
		logLevel: 'warn',
	},
	{
		id: 'measurement not active',
		description: 'Measurement must be active for this request',
		logLevel: 'warn',
	},
	{ id: 'authentication required', description: 'The Smaart API requires a password', logLevel: 'error', auth: true },
	{ id: 'incorrect password', description: 'The Smaart API password is incorrect', logLevel: 'error', auth: true },
	{ id: 'incorect password', description: 'The Smaart API password is incorrect', logLevel: 'error', auth: true },
	{ id: 'internal error', description: 'Smaart reported an internal error', logLevel: 'error' },
]

function lookupError(id) {
	return errors.find((e) => e.id === id) ?? { id, description: `Smaart error: ${id}`, logLevel: 'warn' }
}

function buildGet(target) {
	const payload = { action: 'get' }
	if (target !== undefined) payload.target = target
	return payload
}

function buildSet(target, properties) {
	return { action: 'set', target, properties: [properties] }
}

function buildAuth(password) {
	return { action: 'set', properties: [{ password }] }
}

function buildCapture(measurementName) {
	return { action: 'capture', target: { measurementName } }
}

function buildKeypress(keypress) {
	return { action: 'issueCommand', properties: [{ keypress }] }
}

function buildRenameTrace(traceFilePath, name) {
	return { action: 'set', target: { traceFilePath }, properties: [{ name }] }
}

function clampGain(gain) {
	return Math.max(-200, Math.min(0, gain))
}

function variableId(measurementName) {
	return measurementName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function flattenMeasurements(response) {
	const spectrum = response?.spectrumMeasurements ?? []
	const transfer = response?.transferFunctionMeasurements ?? []
	return [
		...spectrum.map((m) => ({ ...m, type: 'spectrum' })),
		...transfer.map((m) => ({ ...m, type: 'transfer function' })),
	]
}

module.exports = {
	errors,
	lookupError,
	buildGet,
	buildSet,
	buildAuth,
	buildCapture,
	buildKeypress,
	buildRenameTrace,
	clampGain,
	variableId,
	flattenMeasurements,
}
