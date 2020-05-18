import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

async function waitForState(client, checkFn) {
  var robotStatus = await client.getRobotStatus()
  while (!checkFn(robotStatus)) {
    await sleep(1000)
    robotStatus = await client.getRobotStatus()
  }
}

describe('IndyDCPClient', function () {
  describe('#getRobotStatus()', function () {
    this.timeout(20000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      await client.emergency_stop()
      await waitForState(client, status => !status.is_robot_ready)

      await client.reset_robot()

      await waitForState(client, status => status.is_in_resetting)
      await waitForState(client, status => status.is_robot_ready)

      console.log(client.robotStatus)

      client.disconnect()
    })
  })
})
