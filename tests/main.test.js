jest.mock('@companion-module/base', () => ({
	...jest.requireActual('@companion-module/base'),
	InstanceBase: class {
		log() {}
		updateStatus() {}
		setVariableValues() {}
		setActionDefinitions() {}
		setFeedbackDefinitions() {}
		setVariableDefinitions() {}
		setPresetDefinitions() {}
		checkFeedbacks() {}
		saveConfig() {}
	},
	runEntrypoint: () => {},
}))

class FakeSocket {
	static OPEN = 1
	static instances = []
	constructor(url) {
		this.url = url
		this.readyState = 0
		this.listeners = {}
		FakeSocket.instances.push(this)
	}
	addEventListener(event, fn) {
		;(this.listeners[event] ??= []).push(fn)
	}
	emit(event, payload = {}) {
		for (const fn of this.listeners[event] ?? []) fn(payload)
	}
	send() {}
	close() {}
}

const { SmaartInstance } = require('../src/main')

beforeEach(() => {
	jest.useFakeTimers()
	FakeSocket.instances = []
	global.WebSocket = FakeSocket
})

afterEach(() => {
	jest.useRealTimers()
})

function startInstance() {
	const instance = new SmaartInstance({})
	instance.init({ host: '127.0.0.1', port: '26000' })
	return instance
}

test('a refused connection that only fires error still retries', () => {
	const instance = startInstance()
	expect(FakeSocket.instances).toHaveLength(1)
	FakeSocket.instances[0].emit('error')
	expect(instance.reconnectTimer).not.toBeNull()
	jest.advanceTimersByTime(10000)
	expect(FakeSocket.instances).toHaveLength(2)
})

test('error followed by close retries once, not twice', () => {
	const instance = startInstance()
	FakeSocket.instances[0].emit('error')
	FakeSocket.instances[0].emit('close', { code: 1006 })
	jest.advanceTimersByTime(10000)
	expect(FakeSocket.instances).toHaveLength(2)
	expect(instance.reconnectTimer).toBeNull()
})

test('an error after destroy does not retry', async () => {
	const instance = startInstance()
	await instance.destroy()
	FakeSocket.instances[0].emit('error')
	jest.advanceTimersByTime(10000)
	expect(FakeSocket.instances).toHaveLength(1)
})
