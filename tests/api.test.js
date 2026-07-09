const {
	lookupError,
	buildGet,
	buildSet,
	buildAuth,
	buildCapture,
	buildKeypress,
	buildRenameTrace,
	buildFindDelay,
	clampGain,
	clampDelay,
	variableId,
	metricSlug,
	parseMetrics,
	parseViolations,
	zoneForValue,
	flattenCalibratedChannels,
	thresholdsByMetric,
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

	test('find delay with options', () => {
		expect(buildFindDelay('EQ', { automaticallyStart: true, automaticallyInsert: true })).toEqual({
			action: 'findDelay',
			target: { measurementName: 'EQ' },
			properties: [{ automaticallyStart: true }, { automaticallyInsert: true }, { automaticallyStop: false }],
		})
	})

	test('find delay defaults all off', () => {
		expect(buildFindDelay('EQ')).toEqual({
			action: 'findDelay',
			target: { measurementName: 'EQ' },
			properties: [{ automaticallyStart: false }, { automaticallyInsert: false }, { automaticallyStop: false }],
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

describe('clampDelay', () => {
	test('clamps below 0', () => {
		expect(clampDelay(-5)).toBe(0)
	})
	test('clamps above 1000', () => {
		expect(clampDelay(2000)).toBe(1000)
	})
	test('passes normal values', () => {
		expect(clampDelay(21.3)).toBe(21.3)
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

describe('metricSlug', () => {
	test('lowercases and underscores', () => {
		expect(metricSlug('SPL A Slow')).toBe('spl_a_slow')
		expect(metricSlug('LAeq 15')).toBe('laeq_15')
		expect(metricSlug('FS Peak')).toBe('fs_peak')
	})
})

describe('parseMetrics', () => {
	test('merges single-key objects', () => {
		expect(parseMetrics([{ 'SPL Fast': 89.7 }, { 'Peak C': 98.4 }])).toEqual({
			'SPL Fast': 89.7,
			'Peak C': 98.4,
		})
	})
	test('handles missing input', () => {
		expect(parseMetrics(undefined)).toEqual({})
	})
	test('ignores non-numeric properties like violation', () => {
		expect(parseMetrics([{ 'SPL A Slow': 111.2, violation: true }])).toEqual({ 'SPL A Slow': 111.2 })
	})
})

describe('parseViolations', () => {
	test('collects metrics flagged with violation', () => {
		const v = parseViolations([{ 'SPL A Slow': 111.2, violation: true }, { 'Peak C': 90 }])
		expect(v.has('SPL A Slow')).toBe(true)
		expect(v.has('Peak C')).toBe(false)
		expect(v.size).toBe(1)
	})
	test('empty when no violations', () => {
		expect(parseViolations([{ 'SPL Fast': 80 }]).size).toBe(0)
		expect(parseViolations(undefined).size).toBe(0)
	})
})

describe('zoneForValue', () => {
	const t = { greenAboveLevel: 80, yellowAboveLevel: 100, redAboveLevel: 103 }
	test('zones by threshold', () => {
		expect(zoneForValue(104, t)).toBe('red')
		expect(zoneForValue(101, t)).toBe('yellow')
		expect(zoneForValue(85, t)).toBe('green')
		expect(zoneForValue(60, t)).toBe(null)
	})
	test('handles missing data', () => {
		expect(zoneForValue(undefined, t)).toBe(null)
		expect(zoneForValue(90, undefined)).toBe(null)
	})
})

describe('flattenCalibratedChannels', () => {
	test('flattens devices to keyed channels', () => {
		const channels = flattenCalibratedChannels({
			devices: [
				{
					deviceName: 'EVO4',
					activeCalibratedChannels: [
						{
							channelName: 'FOH MIC',
							streamEndpoint: '/api/v4//devices/EVO4/channels/FOH%20MIC',
							alarms: [{ metric: 'Peak C', level: 110 }],
						},
					],
				},
			],
		})
		expect(channels).toEqual([
			{
				key: 'EVO4/FOH MIC',
				deviceName: 'EVO4',
				channelName: 'FOH MIC',
				streamEndpoint: '/api/v4//devices/EVO4/channels/FOH%20MIC',
				alarms: [{ metric: 'Peak C', level: 110 }],
			},
		])
	})
	test('handles empty response', () => {
		expect(flattenCalibratedChannels({ devices: [] })).toEqual([])
		expect(flattenCalibratedChannels(undefined)).toEqual([])
	})
})

describe('thresholdsByMetric', () => {
	test('zips metrics with thresholds', () => {
		const out = thresholdsByMetric({
			metrics: ['FS Peak', 'Peak C'],
			colorThresholds: [
				{ greenAboveLevel: 80, yellowAboveLevel: 100, redAboveLevel: 103 },
				{ greenAboveLevel: 80, yellowAboveLevel: 90, redAboveLevel: 100 },
			],
		})
		expect(out['Peak C'].redAboveLevel).toBe(100)
	})
	test('handles missing lists', () => {
		expect(thresholdsByMetric(undefined)).toEqual({})
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
