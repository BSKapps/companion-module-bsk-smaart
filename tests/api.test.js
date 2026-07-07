const {
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
} = require('../src/api')

describe('payload builders', () => {
	test('bare get has no target', () => {
		expect(buildGet()).toEqual({ action: 'get' })
	})

	test('get with string target', () => {
		expect(buildGet('signalGenerator')).toEqual({ action: 'get', target: 'signalGenerator' })
	})

	test('get with object target', () => {
		expect(buildGet({ measurementName: 'FOH MIC' })).toEqual({
			action: 'get',
			target: { measurementName: 'FOH MIC' },
		})
	})

	test('set wraps properties in array', () => {
		expect(buildSet('signalGenerator', { active: true })).toEqual({
			action: 'set',
			target: 'signalGenerator',
			properties: [{ active: true }],
		})
	})

	test('auth payload', () => {
		expect(buildAuth('pw')).toEqual({ action: 'set', properties: [{ password: 'pw' }] })
	})

	test('capture targets measurement by name', () => {
		expect(buildCapture('MIC1 VS PFL')).toEqual({
			action: 'capture',
			target: { measurementName: 'MIC1 VS PFL' },
		})
	})

	test('keypress command', () => {
		expect(buildKeypress('shift + Z')).toEqual({
			action: 'issueCommand',
			properties: [{ keypress: 'shift + Z' }],
		})
	})

	test('rename trace', () => {
		expect(buildRenameTrace('/tmp/trace.trf', 'FOH-A')).toEqual({
			action: 'set',
			target: { traceFilePath: '/tmp/trace.trf' },
			properties: [{ name: 'FOH-A' }],
		})
	})
})

describe('clampGain', () => {
	test('clamps above 0', () => {
		expect(clampGain(3)).toBe(0)
	})
	test('clamps below -200', () => {
		expect(clampGain(-500)).toBe(-200)
	})
	test('passes normal values', () => {
		expect(clampGain(-18)).toBe(-18)
	})
})

describe('variableId', () => {
	test('replaces spaces and symbols', () => {
		expect(variableId('MIC1 VS PFL')).toBe('MIC1_VS_PFL')
	})
	test('collapses runs and trims edges', () => {
		expect(variableId('Loop-back 1 (L)')).toBe('Loop_back_1_L')
	})
})

describe('flattenMeasurements', () => {
	test('tags types and merges lists', () => {
		const result = flattenMeasurements({
			spectrumMeasurements: [{ measurementName: 'FOH MIC', active: false }],
			transferFunctionMeasurements: [{ measurementName: 'MIC1 VS PFL', active: true, trackingDelay: false }],
		})
		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ measurementName: 'FOH MIC', type: 'spectrum' })
		expect(result[1]).toMatchObject({ measurementName: 'MIC1 VS PFL', type: 'transfer function', active: true })
	})

	test('handles missing lists', () => {
		expect(flattenMeasurements({})).toEqual([])
		expect(flattenMeasurements(undefined)).toEqual([])
	})
})

describe('lookupError', () => {
	test('known error maps to description', () => {
		expect(lookupError('unknown target').description).toContain('Target not recognized')
	})
	test('auth errors flagged', () => {
		expect(lookupError('incorect password').auth).toBe(true)
		expect(lookupError('incorrect password').auth).toBe(true)
	})
	test('unknown error id falls back', () => {
		const e = lookupError('brand new error')
		expect(e.description).toContain('brand new error')
		expect(e.logLevel).toBe('warn')
	})
})
