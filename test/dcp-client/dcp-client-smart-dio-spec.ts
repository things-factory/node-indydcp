import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#getSmartDIs()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var dis = await client.getSmartDIs()
      console.log('Digital Inputs: ', dis)

      await client.setSmartDO(1, true)
      await client.setSmartDO(5, true)
      var dos = await client.getSmartDOs()
      console.log('Digital Outputs: ', dos)

      expect(dos[1]).to.be.true
      expect(dos[5]).to.be.true

      client.disconnect()
    })
  })
})
