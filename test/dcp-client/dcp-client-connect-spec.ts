import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'

describe('IndyDCPClient', function () {
  describe('#connect()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      await client.getRobotStatus()
      console.log(client.robotStatus)

      client.disconnect()
    })
  })
})
