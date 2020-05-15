import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#go_home()', function () {
    it('should return binary string', async () => {
      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()

      await client.go_home()
      console.log(await client.getRobotStatus())

      var robotStatus = await client.getRobotStatus()
      while (robotStatus.is_busy) {
        await sleep(1000)
        robotStatus = await client.getRobotStatus()
      }

      await client.go_zero()
      console.log(await client.getRobotStatus())

      client.disconnect()
    })
  })
})
