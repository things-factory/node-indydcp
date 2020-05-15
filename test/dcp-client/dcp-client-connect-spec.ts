import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'

describe('IndyDCPClient', function () {
  describe('#connect()', function () {
    it('should return binary string', async () => {
      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()
      await client.getRobotStatus()
      console.log(client.robotStatus)
      client.disconnect()
    })
  })
})
