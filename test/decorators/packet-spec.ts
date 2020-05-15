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
          errorCode: ''
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

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'double')
      decorated_double(x) {}
    }

    it('should have same charater value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_char('A'.charCodeAt(0))

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(decorated.reqData.readUInt8(0))).to.equal('A')
    })

    it('should have same 32bit integer value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_int(0x71)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readInt32BE(0)).to.equal(0x71)
    })

    it('should have same boolean value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_bool(1)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readUInt8(0)).to.equal(1)
    })

    it('should have same float value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_float(62431)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readFloatBE(0)).to.equal(62431)
    })

    it('should have same double value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_double(0.00001234)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readDoubleBE(0)).to.equal(0.00001234)
    })

    it('should have same charaters value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_char(['A'.charCodeAt(0)])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(decorated.reqData.readUInt8(0))).to.equal('A')
    })

    it('should have same 32bit integers value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_int([0x71])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readInt32BE(0)).to.equal(0x71)
    })

    it('should have same booleans value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_bool([1])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readUInt8(0)).to.equal(1)
    })

    it('should have same floats value in request data', async function () {
      var decorated = new Clazz()

      await decorated.decorated_float([62431])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readFloatBE(0)).to.equal(62431)
    })

    it('should have same doubles value in request data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_double([0.00001234])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(decorated.reqData.readDoubleBE(0)).to.equal(0.00001234)
    })
  })

  describe('#packet() with echo response data', function () {
    class Clazz {
      public command

      handleCommand(command, reqData) {
        this.command = command

        return {
          errorCode: '',
          resData: reqData,
          resDataSize: reqData.length
        }
      }

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'char', 'char')
      decorated_char(x): any {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'bool', 'bool')
      decorated_bool(x): any {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'int', 'int')
      decorated_int(x): any {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'float', 'float')
      decorated_float(x): any {}

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'double', 'double')
      decorated_double(x): any {}
    }

    it('should have same charater value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_char('A'.charCodeAt(0))

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(value)).to.equal('A')
    })

    it('should have same 32bit integer value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_int(0x71)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value).to.equal(0x71)
    })

    it('should have same boolean value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_bool(1)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value).to.equal(1)
    })

    it('should have same float value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_float(62431)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value).to.equal(62431)
    })

    it('should have same double value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_double(0.00001234)

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value).to.equal(0.00001234)
    })

    it('should have same charaters value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_char(['A'.charCodeAt(0), 'B'.charCodeAt(0)])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(String.fromCharCode(value[0])).to.equal('A')
    })

    it('should have same 32bit integers value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_int([0x71, 0x72])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value[0]).to.equal(0x71)
    })

    it('should have same booleans value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_bool([1, 0])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value[0]).to.equal(1)
    })

    it('should have same floats value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_float([62431, 62432])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value[0]).to.equal(62431)
    })

    it('should have same doubles value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_double([0.00001234, 0.00001235])

      expect(decorated.command).to.equal(CommandCode.CMD_START_CURRENT_PROGRAM)
      expect(value[0]).to.equal(0.00001234)
    })
  })

  describe('#packet() without request data', function () {
    class Clazz {
      public command
      public resData

      handleCommand(command) {
        this.command = command
        var resData

        switch (command) {
          case 1: // char
            resData = Buffer.alloc(1, 'A'.charCodeAt(0))
            break
          case 2: // bool
            resData = Buffer.alloc(1, 1)
            break
          case 3: // int
            resData = Buffer.alloc(4)
            resData.writeInt32BE(0x71)
            break
          case 4: // float
            resData = Buffer.alloc(4)
            resData.writeFloatBE(12345)
            break
          case 5: // double
            resData = Buffer.alloc(8)
            resData.writeDoubleBE(0.0001234)
            break
          case 11: // chars
            resData = Buffer.alloc(2 * 1)
            resData.writeUInt8('A'.charCodeAt(0), 0)
            resData.writeUInt8('B'.charCodeAt(0), 1)
            break
          case 12: // bools
            resData = Buffer.alloc(2 * 1)
            resData.writeUInt8(1, 0)
            resData.writeUInt8(0, 1)
            break
          case 13: // integers
            resData = Buffer.alloc(2 * 4)
            resData.writeInt32BE(0x71, 0)
            resData.writeInt32BE(0x72, 4)
            break
          case 14: // floats
            resData = Buffer.alloc(2 * 4)
            resData.writeFloatBE(12345, 0)
            resData.writeFloatBE(12346, 4)
            break
          case 15: // doubles
            resData = Buffer.alloc(2 * 8)
            resData.writeDoubleBE(0.0001234, 0)
            resData.writeDoubleBE(0.0001235, 8)
            break
        }

        return {
          errorCode: '',
          resData,
          resDataSize: resData.length
        }
      }

      @packet(1, null, 'char')
      decorated_char(): any {}

      @packet(2, null, 'bool')
      decorated_bool(): any {}

      @packet(3, null, 'int')
      decorated_int(): any {}

      @packet(4, null, 'float')
      decorated_float(): any {}

      @packet(5, null, 'double')
      decorated_double(): any {}

      @packet(11, null, 'char')
      decorated_chars(): any {}

      @packet(12, null, 'bool')
      decorated_bools(): any {}

      @packet(13, null, 'int')
      decorated_ints(): any {}

      @packet(14, null, 'float')
      decorated_floats(): any {}

      @packet(15, null, 'double')
      decorated_doubles(): any {}
    }

    it('should have same charater value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_char()

      expect(String.fromCharCode(value)).to.equal('A')
    })

    it('should have same 32bit integer value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_int()

      expect(value).to.equal(0x71)
    })

    it('should have same boolean value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_bool()

      expect(value).to.equal(1)
    })

    it('should have same float value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_float()

      expect(value).to.equal(12345)
    })

    it('should have same double value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_double()

      expect(value).to.equal(0.0001234)
    })

    it('should have same charaters value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_chars()

      expect(String.fromCharCode(value[0])).to.equal('A')
    })

    it('should have same 32bit integers value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_ints()

      expect(value[0]).to.equal(0x71)
    })

    it('should have same booleans value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_bools()

      expect(value[0]).to.equal(1)
    })

    it('should have same floats value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_floats()

      expect(value[0]).to.equal(12345)
    })

    it('should have same doubles value in data', async function () {
      var decorated = new Clazz()

      var value = await decorated.decorated_doubles()

      expect(value[0]).to.equal(0.0001234)
    })
  })
})
