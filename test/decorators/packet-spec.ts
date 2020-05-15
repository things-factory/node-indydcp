import { expect } from 'chai'
import { CommandCode } from '../../src/command-code'
import { packet } from '../../src/decorators'

describe('Decorator', function () {
  describe('#packet()', function () {
    class Clazz {
      public command
      public reqData

      handleCommand(command, reqData) {
        this.command = command
        this.reqData = reqData

        return {
          errorCode: '',
          resData: reqData,
          resDataSize: reqData.length
        }
      }

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'char')
      decorated_char(x) {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'bool')
      decorated_bool(x) {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'int')
      decorated_int(x) {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'float')
      decorated_float(x) {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'double', 'double')
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

    it('should have same charaters value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_char(['A'.charCodeAt(0)])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(decorated.reqData.readUInt8(0))).to.equal('A')
    })

    it('should have same 32bit integers value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_int([0x71])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readInt32BE(0)).to.equal(0x71)
    })

    it('should have same booleans value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_bool([1])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readUInt8(0)).to.equal(1)
    })

    it('should have same floats value in data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_float([62431])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readFloatBE(0)).to.equal(62431)
    })

    it('should have same doubles value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_double([0.00001234])

      console.log('reqData', decorated.reqData)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readDoubleBE(0)).to.equal(0.00001234)
      expect(value[0]).to.equal(0.00001234)
    })
  })
})
