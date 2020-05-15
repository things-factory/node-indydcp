import { expect } from 'chai'
import { CommandCode } from '../../src/command-code'
import { packet } from '../../src/decorators'

describe('Decorator', function () {
  describe('#packet()', function () {
    class Clazz {
      handleCommand(command, reqData) {
        return {
          resData: reqData * reqData,
          errorCode: ''
        }
      }

      @packet(CommandCode.CMD_START_CURRENT_PROGRAM, 'bool' /*, 'buffer' */)
      sqrt(x): any {
        return {
          serializer() {
            return x
          },
          deserializer(resData) {
            return {
              input: x,
              result: resData
            }
          }
        }
      }
    }

    it('should have deserializer value in request data', async function () {
      var clazz = new Clazz()

      var { input, result } = await clazz.sqrt(10)

      expect(input).to.equal(10)
      expect(result).to.equal(100)
    })
  })
})
