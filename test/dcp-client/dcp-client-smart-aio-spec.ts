import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'

describe('IndyDCPClient', function () {
  describe('#get_smart_dis()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var ai = await client.get_smart_ai(1)
      console.log('Analog Input[1]: ', ai)

      await client.set_smart_ao(1, 100)
      var ao1 = await client.get_smart_ao(1)
      console.log('Analog Output[1]: ', ao1)

      expect(ao1).to.be.equal(100)

      await client.set_smart_ao(2, 200)
      var ao2 = await client.get_smart_ao(2)
      console.log('Analog Output[2]: ', ao2)

      expect(ao2).to.be.equal(200)

      client.disconnect()
    })
  })
})
