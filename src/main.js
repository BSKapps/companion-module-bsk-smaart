const { InstanceBase, InstanceStatus, Regex, runEntrypoint } = require('@companion-module/base')
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
	viewPresetChoices,
	flattenCalibratedChannels,
	thresholdsByMetric,
	flattenMeasurements,
} = require('./api')
const updateActions = require('./actions')
const updateFeedbacks = require('./feedbacks')
const updateVariables = require('./variables')
const updatePresets = require('./presets')
const upgrades = require('./upgrades')

const RECONNECT_SECONDS = 10
const REQUEST_TIMEOUT_MS = 3000

class SmaartInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.socket = null
		this.closing = false
		this.reconnectTimer = null
		this.pollTimer = null
		this.pending = new Map()
		this.sequence = 1
		this.state = {
			appInfo: {},
			generator: {},
			measurements: [],
			delays: {},
			splChannels: [],
			splMetrics: [],
			splThresholds: {},
			splValues: {},
			splViolations: {},
			commands: [],
		}
		this.splStreams = new Map()
	}

	async init(config) {
		this.config = config
		this.refreshDefinitions()
		this.connect()
	}

	async destroy() {
		this.closing = true
		this.stopPolling()
		this.clearReconnect()
		this.rejectPending()
		if (this.socket) {
			try {
				this.socket.close(1000)
			} catch (_e) {
				this.log('debug', 'Socket close failed during destroy')
			}
			this.socket = null
		}
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.clearReconnect()
		this.connect()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value:
					'Controls Smaart Suite/LE V9 or newer. Enable the API in Smaart under Options > Preferences > API and match the port here.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Smaart IP / Hostname',
				width: 8,
				default: 'localhost',
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 4,
				regex: Regex.PORT,
				default: '26000',
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password (blank if authentication is off)',
				width: 8,
			},
			{
				type: 'number',
				id: 'pollInterval',
				label: 'Status poll interval (ms)',
				width: 4,
				min: 500,
				max: 10000,
				default: 2000,
			},
			{
				type: 'number',
				id: 'splFPS',
				label: 'SPL meter updates per second (max 8)',
				width: 4,
				min: 1,
				max: 8,
				default: 2,
			},
		]
	}

	refreshDefinitions() {
		updateActions(this)
		updateFeedbacks(this)
		updateVariables(this)
		updatePresets(this)
	}

	measurementChoices(filterType) {
		const list = this.state.measurements.filter((m) => !filterType || m.type === filterType)
		return list.map((m) => ({ id: m.measurementName, label: m.measurementName }))
	}

	viewPresetChoices() {
		return viewPresetChoices(this.state.commands)
	}

	connect() {
		this.closing = false
		this.clearReconnect()
		if (this.socket) {
			try {
				this.socket.close(1000)
			} catch (_e) {
				this.log('debug', 'Socket close failed during reconnect')
			}
			this.socket = null
		}
		if (!this.config?.host || !this.config?.port) {
			this.updateStatus(InstanceStatus.BadConfig, 'Missing host or port')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		let socket
		try {
			socket = new WebSocket(`ws://${this.config.host}:${parseInt(this.config.port)}/api/v4/`)
		} catch (e) {
			this.updateStatus(InstanceStatus.ConnectionFailure, e.message)
			this.scheduleReconnect()
			return
		}
		this.socket = socket

		socket.addEventListener('open', () => {
			if (this.socket !== socket) return
			this.updateStatus(InstanceStatus.Ok)
			this.log('info', `Connected to Smaart at ${this.config.host}:${this.config.port}`)
			this.handshake().catch((e) => this.log('warn', `Handshake failed: ${e.message}`))
		})

		socket.addEventListener('message', (message) => {
			if (this.socket !== socket) return
			this.handleMessage(message.data)
		})

		socket.addEventListener('error', () => {
			if (this.socket !== socket) return
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Socket error')
		})

		socket.addEventListener('close', () => {
			if (this.socket !== socket) return
			this.socket = null
			this.stopPolling()
			this.rejectPending()
			if (!this.closing) {
				this.updateStatus(InstanceStatus.Disconnected, 'Disconnected from Smaart')
				this.scheduleReconnect()
			}
		})
	}

	async handshake() {
		let info = await this.request(buildGet())
		if (!info) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'No response from Smaart')
			this.scheduleReconnect()
			return
		}
		if (info.authenticationRequired) {
			this.log('info', 'Authenticating with Smaart')
			await this.request(buildAuth(this.config.password ?? ''))
			info = (await this.request(buildGet())) ?? info
		}
		this.state.appInfo = info
		this.setVariableValues({
			smaart_version: info.applicationVersion ?? '',
			smaart_app: info.applicationName ?? '',
		})
		const cmds = await this.request(buildGet('commands'), { quiet: true })
		if (cmds && cmds.error === undefined && Array.isArray(cmds.commands)) {
			this.state.commands = cmds.commands.filter((c) => Array.isArray(c.keypresses) && c.keypresses.length > 0)
			this.refreshDefinitions()
		}
		this.startPolling()
	}

	scheduleReconnect() {
		if (this.reconnectTimer || this.closing) return
		this.log('info', `Reconnecting in ${RECONNECT_SECONDS} seconds`)
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.connect()
		}, RECONNECT_SECONDS * 1000)
	}

	clearReconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
	}

	startPolling() {
		this.stopPolling()
		const interval = this.config.pollInterval ?? 2000
		this.pollTimer = setInterval(() => {
			this.poll().catch((e) => this.log('debug', `Poll failed: ${e.message}`))
		}, interval)
		this.poll().catch((e) => this.log('debug', `Poll failed: ${e.message}`))
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
		this.closeSplStreams()
	}

	closeSplStreams() {
		for (const [, stream] of this.splStreams) {
			try {
				stream.close(1000)
			} catch (_e) {
				this.log('debug', 'SPL stream close failed')
			}
		}
		this.splStreams.clear()
	}

	async poll() {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
		if (this.polling) return
		this.polling = true
		try {
			await this.pollOnce()
		} finally {
			this.polling = false
		}
	}

	async pollOnce() {
		const generator = await this.request(buildGet('signalGenerator'), { quiet: true })
		if (generator && generator.error === undefined) this.state.generator = generator

		const measurementsResponse = await this.request(buildGet('measurements'), { quiet: true })
		if (measurementsResponse && measurementsResponse.error === undefined) {
			const measurements = flattenMeasurements(measurementsResponse)
			const namesChanged =
				measurements.map((m) => `${m.type}:${m.measurementName}`).join('|') !==
				this.state.measurements.map((m) => `${m.type}:${m.measurementName}`).join('|')
			this.state.measurements = measurements
			if (namesChanged) this.refreshDefinitions()

			for (const m of measurements.filter((m) => m.type === 'transfer function' && m.active)) {
				const detail = await this.request(buildGet({ measurementName: m.measurementName }), { quiet: true })
				if (detail && detail.error === undefined && detail.delay !== undefined) {
					this.state.delays[m.measurementName] = detail.delay
				}
			}
		}

		const calibrated = await this.request(buildGet('activeCalibratedInputs'), { quiet: true })
		if (calibrated && calibrated.error === undefined) {
			const channels = flattenCalibratedChannels(calibrated)
			const channelsChanged =
				channels.map((c) => c.key).join('|') !== this.state.splChannels.map((c) => c.key).join('|')
			this.state.splChannels = channels
			this.state.splMetrics = calibrated.metrics ?? []
			this.state.splThresholds = thresholdsByMetric(calibrated)
			this.reconcileSplStreams()
			if (channelsChanged) this.refreshDefinitions()
		}

		this.publishState()
	}

	reconcileSplStreams() {
		const wanted = new Map(this.state.splChannels.map((c) => [c.key, c]))
		for (const [key, stream] of this.splStreams) {
			if (!wanted.has(key)) {
				try {
					stream.close(1000)
				} catch (_e) {
					this.log('debug', 'SPL stream close failed')
				}
				this.splStreams.delete(key)
				delete this.state.splValues[key]
				delete this.state.splViolations[key]
			}
		}
		for (const [key, channel] of wanted) {
			if (!this.splStreams.has(key)) this.openSplStream(key, channel)
		}
	}

	openSplStream(key, channel) {
		let stream
		try {
			stream = new WebSocket(`ws://${this.config.host}:${parseInt(this.config.port)}${channel.streamEndpoint}`)
		} catch (e) {
			this.log('warn', `SPL stream failed for ${channel.channelName}: ${e.message}`)
			return
		}
		this.splStreams.set(key, stream)

		stream.addEventListener('open', () => {
			if (this.splStreams.get(key) !== stream) return
			stream.send(JSON.stringify({ action: 'set', properties: [{ targetFPS: Math.min(8, this.config.splFPS ?? 2) }] }))
		})

		stream.addEventListener('message', (message) => {
			if (this.splStreams.get(key) !== stream) return
			let msg
			try {
				msg = JSON.parse(message.data)
			} catch (_e) {
				return
			}
			if (!Array.isArray(msg.metrics)) return
			this.state.splValues[key] = parseMetrics(msg.metrics)
			this.state.splViolations[key] = parseViolations(msg.metrics)
			this.publishSpl(key)
		})

		stream.addEventListener('close', () => {
			if (this.splStreams.get(key) === stream) this.splStreams.delete(key)
		})

		stream.addEventListener('error', () => {
			this.log('debug', `SPL stream error for ${channel.channelName}`)
		})
	}

	publishSpl(key) {
		const channel = this.state.splChannels.find((c) => c.key === key)
		const values = this.state.splValues[key]
		if (!channel || !values) return
		const updates = {}
		for (const [metric, value] of Object.entries(values)) {
			if (!Number.isFinite(value)) continue
			updates[`${metricSlug(metric)}_${variableId(channel.key)}`] = value.toFixed(1)
		}
		this.publishedIds = [...new Set([...(this.publishedIds ?? []), ...Object.keys(updates)])]
		this.setVariableValues(updates)
		this.checkFeedbacks('splAbove', 'splZone', 'splAlarm')
	}

	splChannelChoices() {
		return this.state.splChannels.map((c) => ({
			id: c.key,
			label: `${c.channelName} (${c.deviceName})`,
		}))
	}

	splMetricChoices() {
		return this.state.splMetrics.map((m) => ({ id: m, label: m }))
	}

	splValue(channelKey, metric) {
		return this.state.splValues[channelKey]?.[metric]
	}

	publishState() {
		const values = {
			generator_active: this.state.generator.active ? 'On' : 'Off',
			generator_gain: this.state.generator.gain ?? '',
			generator_type: this.state.generator.type ?? '',
			active_measurements: this.state.measurements.filter((m) => m.active).length,
			spl_logging: this.splLoggingActive() ? 'On' : 'Off',
			last_trace_path: this.state.lastTracePath ?? '',
		}
		for (const m of this.state.measurements) {
			values[`measurement_${variableId(m.measurementName)}_active`] = m.active ? 'On' : 'Off'
			if (m.type === 'transfer function') {
				values[`measurement_${variableId(m.measurementName)}_tracking`] = m.trackingDelay ? 'On' : 'Off'
				if (this.state.delays[m.measurementName] !== undefined) {
					values[`delay_${variableId(m.measurementName)}`] = this.state.delays[m.measurementName].toFixed(2)
				}
			}
		}
		for (const channel of this.state.splChannels) {
			const metrics = this.state.splValues[channel.key]
			if (!metrics) continue
			for (const [metric, value] of Object.entries(metrics)) {
				if (!Number.isFinite(value)) continue
				values[`${metricSlug(metric)}_${variableId(channel.key)}`] = value.toFixed(1)
			}
		}
		if (this.publishedIds) {
			for (const id of this.publishedIds) {
				if (!(id in values)) values[id] = undefined
			}
		}
		this.publishedIds = Object.keys(values).filter((id) => values[id] !== undefined)
		this.setVariableValues(values)
		this.checkFeedbacks()
	}

	handleMessage(data) {
		let msg
		try {
			msg = JSON.parse(data)
		} catch (_e) {
			this.log('warn', 'Received unparseable message from Smaart')
			return
		}

		const seq = msg.sequenceNumber
		const response = msg.response ?? {}
		const waiter = this.pending.get(seq)
		if (waiter) {
			this.pending.delete(seq)
			clearTimeout(waiter.timer)
			waiter.resolve(response)
		}

		if (response.error !== undefined) {
			const err = lookupError(response.error)
			if (!waiter || !waiter.quiet) this.log(err.logLevel, err.description)
			if (err.auth) this.updateStatus(InstanceStatus.AuthenticationFailure, err.description)
		}
	}

	nextSequence() {
		this.sequence = this.sequence >= 0xffff ? 1 : this.sequence + 1
		return this.sequence
	}

	request(payload, opts = {}) {
		return new Promise((resolve) => {
			if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
				this.log('debug', 'Not connected to Smaart, request dropped')
				resolve(null)
				return
			}
			const seq = this.nextSequence()
			payload.sequenceNumber = seq
			const timer = setTimeout(() => {
				this.pending.delete(seq)
				resolve(null)
			}, REQUEST_TIMEOUT_MS)
			this.pending.set(seq, { resolve, timer, quiet: opts.quiet === true })
			try {
				this.socket.send(JSON.stringify(payload))
			} catch (e) {
				this.pending.delete(seq)
				clearTimeout(timer)
				this.log('warn', `Send failed: ${e.message}`)
				resolve(null)
			}
		})
	}

	rejectPending() {
		for (const [, waiter] of this.pending) {
			clearTimeout(waiter.timer)
			waiter.resolve(null)
		}
		this.pending.clear()
	}

	async issueCommand(keypress) {
		await this.request(buildKeypress(keypress))
	}

	splLoggingActive() {
		return this.state.splChannels.length > 0
	}

	async setSplLogging(mode) {
		const active = this.splLoggingActive()
		if (mode === 'toggle' || (mode === 'on' && !active) || (mode === 'off' && active)) {
			await this.issueCommand('option + L')
			await this.poll()
		}
	}

	async setGenerator(active) {
		await this.request(buildSet('signalGenerator', { active }))
		await this.poll()
	}

	async toggleGenerator() {
		await this.setGenerator(!(this.state.generator.active === true))
	}

	async setGeneratorLevel(gain) {
		await this.request(buildSet('signalGenerator', { gain: clampGain(gain) }))
		await this.poll()
	}

	async nudgeGeneratorLevel(delta) {
		const current = this.state.generator.gain
		if (current === undefined) {
			this.log('warn', 'Generator level unknown, nudge skipped')
			return
		}
		await this.setGeneratorLevel(current + delta)
	}

	async resetAverages() {
		await this.request(buildSet('activeMeasurements', { runningAverage: 0 }))
	}

	async setMeasurementActive(measurementName, active) {
		await this.request(buildSet({ measurementName }, { active }))
		await this.poll()
	}

	async toggleMeasurement(measurementName) {
		const m = this.state.measurements.find((m) => m.measurementName === measurementName)
		await this.setMeasurementActive(measurementName, !(m && m.active))
	}

	async setTrackingAll(trackingDelay) {
		await this.request(buildSet({ measurementName: 'allTransferFunctionMeasurements' }, { trackingDelay }))
		await this.poll()
	}

	async toggleTrackingAll() {
		const any = this.state.measurements.some((m) => m.type === 'transfer function' && m.trackingDelay === true)
		await this.setTrackingAll(!any)
	}

	async toggleMeasurementGroup(group) {
		let any
		if (group === 'allTransferFunctionMeasurements') {
			any = this.state.measurements.some((m) => m.type === 'transfer function' && m.active)
		} else if (group === 'allSpectrumMeasurements') {
			any = this.state.measurements.some((m) => m.type === 'spectrum' && m.active)
		} else {
			any = this.state.measurements.some((m) => m.active)
		}
		await this.setMeasurementActive(group, !any)
	}

	async findDelay(measurementName, opts) {
		await this.request(buildFindDelay(measurementName, opts))
		await this.poll()
	}

	async setDelay(measurementName, delay) {
		await this.request(buildSet({ measurementName }, { delay: clampDelay(delay) }))
		await this.poll()
	}

	async setTracking(measurementName, trackingDelay) {
		await this.request(buildSet({ measurementName }, { trackingDelay }))
		await this.poll()
	}

	async captureTrace(measurementName) {
		const response = await this.request(buildCapture(measurementName))
		if (response?.traceFilePath) {
			this.state.lastTracePath = response.traceFilePath
		} else if (Array.isArray(response?.traceFiles) && response.traceFiles.length > 0) {
			this.state.lastTracePath = response.traceFiles[response.traceFiles.length - 1].traceFilePath
		}
		this.setVariableValues({ last_trace_path: this.state.lastTracePath ?? '' })
	}

	async renameTrace(traceFilePath, name) {
		await this.request(buildRenameTrace(traceFilePath, name))
	}
}

runEntrypoint(SmaartInstance, upgrades)

module.exports = { SmaartInstance }
