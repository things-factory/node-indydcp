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
  describe('#go_home()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      await client.go_home()
      console.log(await client.getRobotStatus())

      await waitForState(client, status => !status.is_busy)

      await client.go_zero()
      console.log(await client.getRobotStatus())

      await waitForState(client, status => !status.is_busy)

      client.disconnect()
    })
  })
})
