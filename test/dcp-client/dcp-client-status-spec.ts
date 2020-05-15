import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#getRobotStatus()', function () {
    it('should return binary string', async () => {
      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()

      await client.emergency_stop()
      await client.getRobotStatus()

      console.log(client.robotStatus)
      // expect(client.robotStatus.is_emergency_stop).to.be.true
      // expect(client.robotStatus.is_in_resetting).to.be.true
      // expect(client.robotStatus.is_robot_ready).to.be.true

      await client.reset_robot()
      await client.getRobotStatus()

      console.log(client.robotStatus)
      // expect(client.robotStatus.is_emergency_stop).to.be.true
      // expect(client.robotStatus.is_in_resetting).to.be.true
      // expect(client.robotStatus.is_robot_ready).to.be.true

      await sleep(10000)

      await client.getRobotStatus()

      console.log(client.robotStatus)
      // expect(client.robotStatus.is_emergency_stop).to.be.true
      // expect(client.robotStatus.is_in_resetting).to.be.true
      // expect(client.robotStatus.is_robot_ready).to.be.true

      client.disconnect()
    })
  })
})
