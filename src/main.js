const { InstanceBase, InstanceStatus, Regex, runEntrypoint } = require('@companion-module/base')
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
		}
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
	}

	async poll() {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return

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

		this.publishState()
	}

	publishState() {
		const values = {
			generator_active: this.state.generator.active ? 'On' : 'Off',
			generator_gain: this.state.generator.gain ?? '',
			generator_type: this.state.generator.type ?? '',
			active_measurements: this.state.measurements.filter((m) => m.active).length,
		}
		for (const m of this.state.measurements) {
			values[`measurement_${variableId(m.measurementName)}_active`] = m.active ? 'On' : 'Off'
			if (m.type === 'transfer function' && this.state.delays[m.measurementName] !== undefined) {
				values[`delay_${variableId(m.measurementName)}`] = this.state.delays[m.measurementName].toFixed(2)
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

	async setGenerator(active) {
		await this.request(buildSet('signalGenerator', { active }))
		await this.poll()
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

	async setTracking(measurementName, trackingDelay) {
		await this.request(buildSet({ measurementName }, { trackingDelay }))
		await this.poll()
	}

	async captureTrace(measurementName) {
		await this.request(buildCapture(measurementName))
	}

	async renameTrace(traceFilePath, name) {
		await this.request(buildRenameTrace(traceFilePath, name))
	}
}

runEntrypoint(SmaartInstance, upgrades)

module.exports = { SmaartInstance }
