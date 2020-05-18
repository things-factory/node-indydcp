import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'

describe('IndyDCPClient', function () {
  describe('#getJointPos()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var zz = await client.getJointPos()
      console.log('return value - joint pos', zz)

      var aa = await client.getTaskPos()
      console.log('return value - task pos', aa)

      client.disconnect()
    })
  })
})
