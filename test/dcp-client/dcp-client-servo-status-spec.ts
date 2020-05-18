import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#getServoState()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var state: any = await client.getServoState()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      console.log('Turn off joint 6th servo')
      state = await client.setServo([true, true, true, true, true, false])

      var state: any = await client.getServoState()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      console.log('Turn on joint 6th servo')
      await client.setServo([true, true, true, true, true, true])

      var state: any = await client.getServoState()
      console.log('Servo: ', state.servoState)
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      console.log('Turn on joint 6th brake')
      await client.setBrake([true, false, false, false, false, true])

      state = await client.getServoState()
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      // console.log('Turn off joint 6th brake')
      await client.setBrake([false, false, false, false, false, false])

      state = await client.getServoState()
      console.log('Brake: ', state.brakeState)

      await sleep(1000)

      await client.getRobotStatus()
      console.log(client.robotStatus)

      client.disconnect()
    })
  })
})
