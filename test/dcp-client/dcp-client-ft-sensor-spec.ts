import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'

describe('IndyDCPClient', function () {
  describe('#getRobotFtSensorRaw()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var xx = await client.getRobotFtSensorRaw()
      console.log('return value - sensor raw', xx)

      var yy = await client.getRobotFtSensorProcess()
      console.log('return value - sensor process', yy)

      client.disconnect()
    })
  })
})
