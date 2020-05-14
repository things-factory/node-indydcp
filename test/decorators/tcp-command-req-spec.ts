import { expect } from 'chai'
import { CommandCode } from '../../src/command-code'
import { tcp_command_req } from '../../src/decorators'

describe('Decorator', function () {
  describe('#tcp_command_req()', function () {
    class Clazz {
      public command
      public reqData

      handleCommand(command, reqData) {
        this.command = command
        this.reqData = reqData
      }

      @tcp_command_req(CommandCode.CMD_START_CURRENT_PROGRAM, 'char')
      decorated_char(x) {}

      @tcp_command_req(CommandCode.CMD_START_CURRENT_PROGRAM, 'bool')
      decorated_bool(x) {}

      @tcp_command_req(CommandCode.CMD_START_CURRENT_PROGRAM, 'int')
      decorated_int(x) {}

      @tcp_command_req(CommandCode.CMD_START_CURRENT_PROGRAM, 'float')
      decorated_float(x) {}

      @tcp_command_req(CommandCode.CMD_START_CURRENT_PROGRAM, 'double')
      decorated_double(x) {}
    }

    it('should have same charater value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_char('A'.charCodeAt(0))

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(decorated.reqData.readUInt8(0))).to.equal('A')
    })

    it('should have same 32bit integer value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_int(0x71)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readInt32BE(0)).to.equal(0x71)
    })

    it('should have same boolean value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_bool(1)

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readUInt8(0)).to.equal(1)
    })

    it('should have same float value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_float(62431)

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readFloatBE(0)).to.equal(62431)
    })

    it('should have same double value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_double(0.00001234)

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readDoubleBE(0)).to.equal(0.00001234)
    })

    it('should have same charater value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_char(['A'.charCodeAt(0)])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(decorated.reqData.readUInt8(0))).to.equal('A')
    })

    it('should have same 32bit integer value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_int([0x71])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readInt32BE(0)).to.equal(0x71)
    })

    it('should have same boolean value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_bool([1])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readUInt8(0)).to.equal(1)
    })

    it('should have same float value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_float([62431])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readFloatBE(0)).to.equal(62431)
    })

    it('should have same double value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_double([0.00001234])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readDoubleBE(0)).to.equal(0.00001234)
    })
  })
})
