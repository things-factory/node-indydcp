import { expect } from 'chai'
import {
  socket_connect,
  tcp_command,
  tcp_command_rec,
  tcp_command_req,
  tcp_command_req_rec
} from '../../src/decorators'

describe('Decorator', function () {
  describe('#tcp_command()', function () {
    class Clazz {
      public lock
      public lockcount = 0
      public releasecount = 0
      public executed = false

      constructor() {
        this.lock = {
          acquireAsync: () => {
            this.lockcount++
          },
          release: () => {
            this.releasecount++
          }
        }
      }

      @tcp_command()
      decorated() {
        this.executed = true
      }
    }

    it('should return -1 when the value is not present', async function () {
      var decorated = new Clazz()

      await decorated.decorated()

      expect(decorated.executed).to.be.true
      expect(decorated.lockcount).to.equal(1)
      expect(decorated.releasecount).to.equal(1)
    })
  })
})
