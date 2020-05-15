import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#get_servo_state()', function () {
    it('should return binary string', async () => {
      this.timeout(10000)

      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()

      var state = await client.get_servo_state()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      console.log('Turn off joint 6th servo')
      await client.set_servo([1, 1, 1, 1, 1, 0])
      await sleep(0.5)
      console.log('Turn on joint 6th brake')
      await client.set_brake([0, 0, 0, 0, 0, 1])

      state = await client.get_servo_state()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)
      client.disconnect()

      await client.getRobotStatus()
      console.log(client.robotStatus)

      client.disconnect()
    })
  })
})
