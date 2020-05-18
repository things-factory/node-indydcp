import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#get_smart_dis()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var dis = await client.get_smart_dis()
      console.log('Digital Inputs: ', dis)

      await client.set_smart_do(1, true)
      await client.set_smart_do(5, true)
      var dos = await client.get_smart_dos()
      console.log('Digital Outputs: ', dos)

      expect(dos[1]).to.be.true
      expect(dos[5]).to.be.true

      client.disconnect()
    })
  })
})
