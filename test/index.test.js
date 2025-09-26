'use strict'
const test = require('brittle')
const b4a = require('b4a')
const sodium = require('sodium-native')
const IPC = require('pear-ipc')
const { isWindows } = require('which-runtime')
const message = require('..')

function pipeId(s) {
  const buf = b4a.allocUnsafe(32)
  sodium.crypto_generichash(buf, b4a.from(s))
  return b4a.toString(buf, 'hex')
}

test('message', async (t) => {
  t.plan(1)
  const kIPC = Symbol('test.ipc')
  const socketPath = isWindows
    ? `\\\\.\\pipe\\test-${pipeId(__dirname)}`
    : __dirname + '/test.sock' // eslint-disable-line
  const srv = new IPC.Server({
    socketPath,
    handlers: {
      message(msg) {
        t.alike(msg, { some: 'props' })
      }
    }
  })
  t.teardown(() => srv.close())
  await srv.ready()
  const ipc = new IPC.Client({ socketPath })
  t.teardown(() => ipc.close())
  await ipc.ready()
  class API {
    static IPC = kIPC
    get [kIPC]() {
      return ipc
    }
  }
  global.Pear = new API()

  await message({ some: 'props' })
})
